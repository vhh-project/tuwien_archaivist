from flask import Flask, request, send_from_directory
from flask_cors import CORS
import vespa_util
import config

app = Flask(__name__)
CORS(app)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/search/', methods=['GET'])
def search():
    query = request.args.get('query', default='', type=str)
    page = request.args.get('page', 0, type=int)
    hit_count = request.args.get('hits', 5, type=int)
    language = request.args.get('language', default='', type=str)
    hits, query_metadata, bounding_boxes, total = \
        vespa_util.query(query, hits=hit_count, page=page, language=language)
    return {
        "hits": hits,
        "queryMetadata": query_metadata,
        "boundingBoxes": bounding_boxes,
        "total": total
    }


@app.route('/snippets/', methods=['POST'])
def build_snippets():
    data = request.get_json()
    query_snippets = vespa_util.build_query_snippets(data['hit'], data['stems'])
    return query_snippets


@app.route('/snippet/<snippet_id>')
def show_snippet(snippet_id):
    return send_from_directory(config.snippet_dir, snippet_id + config.convert_suffix)


@app.route('/status')
def status():
    return 'Up and running!'


@app.route('/document/<doc_name>/page/<page_number>/image')
def show_document_page_image(doc_name, page_number):
    return send_from_directory(config.metadata_path, doc_name + '/' + page_number + config.convert_suffix)


@app.route('/document/<doc_name>/download')
def download_document_file(doc_name):
    return send_from_directory(config.metadata_path, doc_name + '.pdf', as_attachment=True)


if __name__ == '__main__':
    app.run()
