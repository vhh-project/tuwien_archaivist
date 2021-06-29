import { SearchResult } from './SearchResult';
import { SearchResultItem } from './SearchResultItem';
import { Globals } from '../globals';


export abstract class ModuleData {
    type: ModuleType;
    result: SearchResult;
    snippets: any = {};
    query: string;
    page = 0;
    language = '';
    globals = new Globals();

    constructor(type: ModuleType, query: string, result: SearchResult, language = '') {
        this.type = type;
        this.result = result;
        this.query = query;
        this.language = language;
    }

    abstract getHistoryText(): string;
    abstract getHistoryIconClass(): string;
}

export class SearchModuleData extends ModuleData {
    constructor(query: string, result: SearchResult, language = '') {
        super(ModuleType.Search, query, result, language);
    }

    getHistoryText(): string {
        return `'${this.query}' (${ this.globals.languageCodeToName(this.language) })`;
    }

    getHistoryIconClass(): string {
        return 'fa-search';
    }
}

export class DocumentModuleData extends ModuleData {
    resultItem?: SearchResultItem;
    constructor(query: string, result: SearchResult, resultItem: SearchResultItem, language = '') {
        super(ModuleType.Document, query, result, language);
        this.resultItem = resultItem;
    }

    getHistoryText(): string {
        let page = this.resultItem?.fields.page;
        if (page !== undefined) {
            page += 1;
        }
        return `${this.resultItem?.fields.parent_doc} p. ${page}`;
    }

    getHistoryIconClass(): string {
        return 'fa-book';
    }

    getDocLanguage(): string {
        if (this.resultItem && this.resultItem.fields) {
            return this.resultItem.fields.language;
        }

        return '';
    }
}

export enum ModuleType {
    Search,
    Document
}
