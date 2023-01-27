import os

from flask import Flask, request, abort, send_from_directory, render_template, flash, redirect
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.middleware.profiler import ProfilerMiddleware

import config
import bounding_boxes
import stemmer
import synonym_util
import vespa_util

app = Flask(__name__)
# app.wsgi_app = ProfilerMiddleware(app.wsgi_app, profile_dir='./analysis/profiler_cherrypick/komeens/full')
CORS(app)
ALLOWED_EXTENSIONS = ['pdf']


@app.route('/')
def hello_world():
    return 'Hello World!'


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload', methods=['POST'])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return ''


@app.route('/search/', methods=['GET'])
def search():
    query = request.args.get('query', default='', type=str)
    page = request.args.get('page', 0, type=int)
    hit_count = request.args.get('hits', 5, type=int)
    language = request.args.get('language', default='', type=str)
    document = request.args.get('document', default=None)
    order_by = request.args.get('order_by', default='')
    direction = request.args.get('direction', default='desc')
    stem_filter = request.args.get('stem_filter', default='')
    try:
        hits, query_metadata, bounding_boxes, total = \
            vespa_util.query(
                query,
                hits=hit_count,
                page=page,
                language=language,
                document=document,
                order_by=order_by,
                direction=direction,
                stem_filter=stem_filter)
    except vespa_util.VespaTimeoutException:
        abort(504)

    return {
        "hits": hits,
        "queryMetadata": query_metadata,
        "boundingBoxes": bounding_boxes,
        "total": total
    }


@app.route('/snippets/', methods=['POST'])
def build_snippets():
    data = request.get_json()

    # Remove translation artifacts
    data['stems'].pop('', None)
    languages = set([language for stem, value in data['stems'].items() for language in value['languages']])
    hit_lang = data['hit']['fields']['language']
    data['stems'] = [stem for stem, value in data['stems'].items()
                     if stem not in data['stem-filters'] and
                     (hit_lang not in languages or hit_lang in value['languages'])]
    data['synonyms'] = __stem_filter_synonyms(data['synonyms'], data['stem-filters'])

    query_snippets = vespa_util.build_query_snippets(data['hit'], data['stems'], data['synonyms'])
    return query_snippets


@app.route('/snippet/<snippet_id>')
def show_snippet(snippet_id):
    return send_from_directory(config.snippet_dir, snippet_id + config.convert_suffix)


@app.route('/bounding-boxes/', methods=['POST'])
def build_bounding_box_html():
    data = request.get_json()
    bounding_data = data['bounding-data']
    boxes = bounding_data['boxes']
    dimensions = bounding_data['dimensions']
    metadata = data['meta-data']
    translations = metadata['translations']
    stems = {stem: terms
             for phrase_translations in translations
             for stem, terms in phrase_translations['stems'].items()
             if stem != '' and stem not in data['stem-filters']
             and (data['language'] in terms['languages']
                  or data['language'] not in phrase_translations['languages'])
             }
    synonyms = [synonym for phrase_translations in translations for synonym in phrase_translations['synonyms']]
    synonyms = __stem_filter_synonyms(synonyms, data['stem-filters'])
    terms = vespa_util.get_relevant_terms(stems, bounding_data['stems'])
    if 'surrounding-box' in data.keys():
        flat_relative_boxes = bounding_boxes \
            .flatten_snippet_bounding_boxes(boxes, data['surrounding-box'])
        width = data['surrounding-box'][1] - data['surrounding-box'][0]
        height = data['surrounding-box'][3] - data['surrounding-box'][2]
    else:
        flat_relative_boxes = bounding_boxes \
            .flatten_bounding_boxes(boxes, dimensions['origWidth'], dimensions['origHeight'])
        width = dimensions['origWidth']
        height = dimensions['origHeight']
    synonym_positions = vespa_util.find_relevant_synonym_positions([box['word'] for box in flat_relative_boxes],
                                                                   synonyms, bounding_data['stems'])
    mainterm_map = {synonym: item['mainTerm']
                    for phrase_translations in translations
                    for item in phrase_translations['synonyms']
                    for synonym in synonym_util.process_synonyms([item['terms']])}
    stem_map = {term: stems for phrase_translations in translations for term, stems in
                phrase_translations['stemMap'].items()}
    return {
        'content': render_template('bounding_boxes.html',
                                   boxes=flat_relative_boxes,
                                   terms=terms,
                                   stem_map=stem_map,
                                   stems=stems,
                                   synonym_positions=synonym_positions,
                                   mainterm_map=mainterm_map,
                                   width=width,
                                   height=height,
                                   get_word_title=get_word_title)
    }


@app.route('/status')
def status():
    return 'Up and running!'


@app.route('/document/<doc_name>/page/<page_number>')
def get_page_data(doc_name, page_number):
    try:
        result, bounding_data = vespa_util.query_doc_page(doc_name, page_number)
        return {
            'item': result,
            'boundingData': bounding_data
        }
    except FileNotFoundError:
        return '', 204


@app.route('/document/<doc_name>/page/<page_number>/image')
def show_document_page_image(doc_name, page_number):
    return send_from_directory(config.metadata_path, doc_name + '/' + page_number + config.convert_suffix)


@app.route('/document/<doc_name>/download')
def download_document_file(doc_name):
    return send_from_directory(config.metadata_path, doc_name + '.pdf', as_attachment=True)


def get_word_title(word, stems, terms, synonyms, mainterm_map):
    title = word
    if word in terms:
        stem = terms[word]
        languages = [stemmer.languages[language].capitalize()
                     for language in stems[stem]['languages'] if language != 'un']
        return title + f" | stemmed and normalized base form: '{stem}' " \
                       f"({' | '.join(languages)})"
    elif synonyms:
        synonym_title = ''
        for i, synonym in enumerate(synonyms):
            try:
                synonym_title += f"'{synonym}' synonym for '{mainterm_map[synonym]}'"
            except KeyError:
                if word == synonym:
                    synonym_title += f"'{synonym}' (main synonym term)"
            if i < len(synonyms) - 1:
                synonym_title += ' | '
        return synonym_title
    else:
        return title


def __stem_filter_synonyms(synonyms, stem_filters):
    filtered_synonyms = []
    for synonym in synonyms:
        mainTerm = synonym['mainTerm'] if synonym['mainTerm'] not in stem_filters else ''
        terms = [term for term in synonym['terms'] if term not in stem_filters]
        filtered_synonyms.append({'mainTerm': mainTerm, 'terms': terms})
    return filtered_synonyms


if __name__ == '__main__':
    app.run()
