import { HttpParams } from '@angular/common/http';
import { SearchType } from 'src/app/core/enums/SearchType';
import { Document } from 'src/app/core/models/Document';
import { ModuleData, SwitchModuleData } from 'src/app/core/models/ModuleData';

export class SearchQueryParams {
    queries?: string[];
    moduleData?: ModuleData;
    searchType!: SearchType;
    document?: Document;
    searchOrigin!: string;

    static fromSearchMeta(searchOrigin: string, searchType = SearchType.normal): SearchQueryParams {
        const params = new SearchQueryParams();
        params.searchType = searchType;
        params.searchOrigin = searchOrigin;
        return params;
    }

    static fromQuery(query: string, searchOrigin: string, searchType = SearchType.normal, document?: Document): SearchQueryParams {
        const params = new SearchQueryParams();
        params.queries = [query];
        params.searchType = searchType;
        params.document = document;
        params.searchOrigin = searchOrigin;
        return params;
    }

    static fromModuleData(
        moduleData: ModuleData,
        searchOrigin = '',
        searchType = SearchType.normal,
        document?: Document
    ): SearchQueryParams {
        const params = new SearchQueryParams();
        params.moduleData = moduleData;
        params.searchType = searchType;

        if (!document && moduleData instanceof SwitchModuleData) {
            params.document = moduleData.document;
        } else {
            params.document = document;
        }
        params.searchOrigin = searchOrigin;
        return params;
    }

    createHttpParams(): HttpParams {

        let params = new HttpParams();
        // switch (this.searchType) {
        //     case SearchType.normal:
        if (this.queries && !this.moduleData) {
            params = new HttpParams()
            .set('query', JSON.stringify(this.queries))
            .set('hits', '10');
        } else {
            params = this.fillModuleParams();
        }

        // }
        return params;
    }

    getQueries(): string[] {
        return this.queries ? this.queries : [];
    }

    pushQueryItems(items: string[]): void {
        if (this.queries) {
            this.queries.push(...items);
        } else {
            this.queries = items;
        }
    }

    private getOrDefault(value: any, defaultValue: any): any {
        return value ? value : defaultValue;
    }

    private fillModuleParams(): HttpParams {
        let params = new HttpParams();
        if (this.moduleData) {
            const queries = this.queries ? this.queries : this.moduleData?.queries;
            params = params
            .set('query', JSON.stringify(queries))
            .set('page',  this.getOrDefault(this.moduleData?.page, 0))
            .set('language', this.getOrDefault(this.moduleData?.language, ''))
            .set('hits', '10')
            .set('order_by', this.moduleData.orderBy)
            .set('direction', this.moduleData.direction)
            .set('stem_filter', JSON.stringify(this.moduleData.getStemFilters()));
            if (this.document) {
                params = params.set('document', this.document?.parent_doc);
            }
        }

        return params;
    }
}

