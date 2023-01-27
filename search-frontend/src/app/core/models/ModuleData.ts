import { SearchResult } from './SearchResult';
import { SearchResultItem } from './SearchResultItem';
import { Globals } from '../constants/globals';
import { Document } from './Document';
import { StemFilter } from './StemFilter';


export abstract class ModuleData {
    type: ModuleType;
    result: SearchResult;
    snippets: any = {};
    queries: string[] = [];
    private stemFilters: StemFilter[] = [];
    page = 0;
    language = '';
    orderBy = '';
    direction = 'desc';
    globals = new Globals();
    switchModule?: SwitchModuleData;
    snippetLessHits = 0;

    constructor(type: ModuleType, queries: string[], result: SearchResult, language = '', stemFilters: StemFilter[] = []) {
        this.type = type;
        this.result = result;
        this.queries = queries;
        this.language = language;
        this.stemFilters = stemFilters;
    }

    abstract getHistoryText(): string;
    abstract getHistoryIconClass(): string;

    addSwitchModule(result: SearchResult, document: Document): void {
        this.switchModule = new SwitchModuleData(this.queries, result, this.language, document, this.stemFilters);
    }

    getAnalyticsPayload(): any {
        return {
            module_query: JSON.stringify(this.queries),
            module_type: ModuleType[this.type],
            module_language: this.language === '' ? 'all' : this.language,
            module_stem_filters: JSON.stringify(this.stemFilters)
        };
    }

    getLoadedText(): string {
        return '';
    }

    getHitsWithSnippetsCount(): number {
        let count = 0;
        for (const doc of Object.keys(this.snippets)) {
            for (const page of Object.keys(this.snippets[doc])) {
                if (this.snippets[doc][page].names.length > 0) {
                    count++;
                }
            }
        }
        return count;
    }

    getStemFilters(): StemFilter[] {
        return this.stemFilters;
    }

    setStemFilters(stemFilters: StemFilter[]): void {
        this.stemFilters = stemFilters;
    }

    addStemFilter(language: string, stem: string): void {
        const stemFilter = this.stemFilters.find(filter => filter.getLanguage() === language);
        if (!stemFilter) {
            this.stemFilters.push(new StemFilter(language, [stem]));
        } else {
            stemFilter.addStem(stem);
        }
    }

    removeStemFilter(language: string, index: number): string | any {
        const filterIndex = this.stemFilters.findIndex(filter => filter.getLanguage() === language);
        const stemFilter = this.stemFilters[filterIndex];
        if (stemFilter) {
            const stem = stemFilter.getStems().splice(index, 1)[0];
            if (stemFilter.getStems().length === 0) {
                // Remove empty language StemFilter object from array
                this.stemFilters.splice(filterIndex, 1);
            }
            return stem;
        }
    }

    getLanguageStemFilters(language: string): string [] {
        const stemFilter = this.stemFilters.find(filter => filter.getLanguage() === language);
        if (stemFilter) {
            return stemFilter.getStems();
        }
        return [];
    }

    hasStemFilters(): boolean {
        return this.stemFilters.length > 0;
    }
}

export class SearchModuleData extends ModuleData {
    constructor(queries: string[], result: SearchResult, language = '', stemFilters: StemFilter[] = []) {
        super(ModuleType.Search, queries, result, language, stemFilters);
    }

    getHistoryText(): string {
        return `'${this.queries.join(' + ')}' (${ this.globals.languageCodeToName(this.language) })`;
    }

    getHistoryIconClass(): string {
        return 'fa-search';
    }

    getLoadedText(): string {
        let text = `${this.result.total} entries found!`;
        const snippetHitCount = this.getHitsWithSnippetsCount();
        if (snippetHitCount === 0) {
            text += ' (no entries loaded)';
        } else if (this.result.total === (snippetHitCount + this.snippetLessHits)) {
            text += ' (All entries loaded)';
        } else {
            text += ` (${snippetHitCount} loaded)`;
        }
        return text ;
    }
}

export class SwitchModuleData extends SearchModuleData {
    document: Document;

    constructor(queries: string[], result: SearchResult, language = '', document: Document, stemFilters: StemFilter[] = []) {
        super(queries, result, language, stemFilters);
        this.document = document;
        this.type = ModuleType.DocumentSearch;
    }

    getHistoryText(): string {
        return `'${this.queries.join(' + ')}' in '${this.document.parent_doc}'`;
    }

    getHistoryIconClass(): string {
        return 'fa-book';
    }

    getAnalyticsPayload(): object {
        const payload = super.getAnalyticsPayload();
        const extraPayload = {
            doc_id: this.document.documentid,
            doc_name: this.document.parent_doc,
            doc_language: this.document.language,
            doc_page: this.document.page,
            doc_collection: this.document.collection
        };
        return { ...payload, ...extraPayload};
    }
}

export class DocumentModuleData extends ModuleData {
    resultItem?: SearchResultItem;
    constructor(queries: string[], result: SearchResult, resultItem: SearchResultItem, language = '', stemFilters: StemFilter[] = []) {
        super(ModuleType.Document, queries, result, language, stemFilters);
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
        return 'fa-file-text';
    }

    getDocLanguage(): string {
        if (this.resultItem && this.resultItem.fields) {
            return this.resultItem.fields.language;
        }

        return '';
    }

    getAnalyticsPayload(): object {
        const payload = super.getAnalyticsPayload();
        const extraPayload = {
            doc_id: this.resultItem?.fields.documentid,
            doc_name: this.resultItem?.fields.parent_doc,
            doc_language: this.resultItem?.fields.language,
            doc_page: this.resultItem?.fields.page,
            doc_collection: this.resultItem?.fields.collection
        };
        return { ...payload, ...extraPayload};
    }
}

export enum ModuleType {
    Search,
    Document,
    DocumentSearch
}
