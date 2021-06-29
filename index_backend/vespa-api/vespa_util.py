from vespa.application import Vespa
import json
from langdetect import detect
import ast
import image_processing
import stemmer
import config

url = "http://baseline"
schema = "baseline"
port = 8080
app = Vespa(url, port)
searchChain = "multilangchain"
traceLevel = 0
timeout = "1s"
renderer = "query-meta-json"


def query(phrase, hits=5, page=0, language=''):
    languageAnd = ''
    if language:
        languageAnd = f'and language contains "{language}"'

    yql = f'select * from sources * where body contains \"{phrase}\" {languageAnd};'

    result = app.query(body={
        "traceLevel": traceLevel,
        "searchChain": searchChain,
        "hits": hits,
        "offset": page * hits,
        "timeout": timeout,
        "yql": yql,
        "presentation.format": renderer
    })
    query_hits = result.hits

    query_metadata = result.json['root']['query-metadata']
    multilang_terms = __collect_multilang_query_terms(query_metadata['translations'])
    multilang_stems = __collect_multilang_query_stems(query_metadata['translations'])
    query_metadata['translations']['stems'] = multilang_stems
    query_metadata['translations']['flatTerms'] = multilang_terms
    return result.hits, result.json['root']['query-metadata'], \
           get_bounding_box_data(query_hits), result.number_documents_retrieved


def get_bounding_box_data(hits):
    bounding_boxes = {}
    for hit in hits:
        doc = hit['fields']['parent_doc']
        page = hit['fields']['page']
        box_data = __load_meta(doc, page)
        try:
            bounding_boxes[doc][page] = box_data
        except KeyError:
            bounding_boxes[doc] = {}
            bounding_boxes[doc][page] = box_data
    return bounding_boxes


def build_query_snippets(hit, stems):
    snippet_data = {}
    relevant_terms = []
    doc = hit['fields']['parent_doc']
    page = hit['fields']['page']
    relevant_hit_terms = __get_relevant_stem_terms(doc, page, stems)
    relevant_terms.extend(relevant_hit_terms)
    hit_snippets, hit_snippets_boxes, box_data = image_processing.build_snippets(doc, page, relevant_hit_terms)
    # TODO do something with hit_snippets_boxes
    hit_snippets_names = image_processing.store_snippets(hit_snippets)
    try:
        snippet_data[doc][page] = {'names': hit_snippets_names, 'boxes': hit_snippets_boxes}
    except KeyError:
        snippet_data[doc] = {}
        snippet_data[doc][page] = {'names': hit_snippets_names, 'boxes': hit_snippets_boxes}
    return snippet_data


def __collect_multilang_query_terms(translations):
    terms = set()
    for translation in translations['translations']:
        for term in translation['content']:
            terms.add(term.lower())
    return list(terms)


def __collect_multilang_query_stems(translations):
    stems = {}
    for translation in translations['translations']:
        stems.update(stemmer.stem(translation['content'], translation['languageCode']))
    return list(stems.keys())


def __get_relevant_stem_terms(doc, page, stems):
    metadata = __load_meta(doc, page)
    page_stems = metadata['stems']
    relevant_terms = []
    for stem in stems:
        if stem in page_stems:
            relevant_terms.extend(page_stems[stem])
    return relevant_terms


def __load_meta(doc, page):
    doc_dir = f'{config.metadata_path}/{doc}'
    with open(f'{doc_dir}/{page}.json', 'r') as file:
        metadata = json.load(file)
        return metadata


def feed(id, parent_doc, page, content):
    response = app.feed_data_point(
        schema="baseline",
        data_id=str(id),
        fields={
            "language": detect(content),
            "parent_doc": parent_doc,
            "page": page,
            "body": content
        }
    )
    content = ast.literal_eval(response.content.decode("UTF-8"))
    if (response.status_code >= 400):
        print(response.status_code, content['message'], end="\n")


if __name__ == '__main__':
    results = query('signal corps')
    print(json.dumps(results, indent=4, sort_keys=True))
