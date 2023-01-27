import json


with open('errors.json', 'r') as f:
    errors = json.load(f)
    doc_errors = 0
    page_errors = 0
    for error in errors:
        if error['page'] > -1:
            page_errors += 1
        else:doc_errors += 1
        print(f'{error["file_name"]} | {error["page"]}\n------------------------------------')
        print(f'{error["trace"]}------------------------------------\n')
    print('Doc errors:', doc_errors)
    print('Page errors:', page_errors)