import { Injectable } from '@angular/core';
import { from, Observable, Subscriber } from 'rxjs';
import { SearchType } from 'src/app/core/enums/SearchType';
import { ModuleData, SearchModuleData, SwitchModuleData } from 'src/app/core/models/ModuleData';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { SelectionTooltipService } from 'src/app/core/services/selection-tooltip.service';
import { SearchQueryParams } from '../models/SearchQueryParams';
import { VespaService } from './vespa.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(
    private vespaService: VespaService,
    private analyticsService: AnalyticsService,
    private selectionTooltipService: SelectionTooltipService
    ) {
  }

  private processNormalSearch(params: SearchQueryParams): Observable<ModuleData> {
    const observable = new Observable<ModuleData> ( subscriber => {
      if (!params.queries && params.moduleData) {
        params.queries = params.moduleData.queries;
      }

      this.sendSearchEvent(params);
      this.sendSearchRequest(subscriber, params);
    });

    return observable;
  }

  private processFilterSearch(params: SearchQueryParams): Observable<ModuleData> {
    const observable = new Observable<ModuleData> ( subscriber => {
      params.pushQueryItems(this.selectionTooltipService.getPreviousModuleQueries().slice());
      const previousModule = this.selectionTooltipService.getPreviousModule(true);
      params.moduleData = previousModule;
      this.sendSearchEvent(params, previousModule);
      this.sendSearchRequest(subscriber, params);
    });

    return observable;
  }

  private processStemFilterSearch(params: SearchQueryParams): Observable<ModuleData> {
    const observable = new Observable<ModuleData> ( subscriber => {
      const previousModule = this.selectionTooltipService.getPreviousModule();
      const previousStem = this.selectionTooltipService.getRelevantItemStem();
      if (previousStem !== null) {
        previousModule?.addStemFilter(this.selectionTooltipService.previousLanguage, previousStem);
        params.moduleData = previousModule;
        this.sendSearchEvent(params);
        this.sendSearchRequest(subscriber, params);
      } else {
        subscriber.error('Empty selection');
      }
    });
    return observable;
  }

  private sendSearchRequest(subscriber: Subscriber<ModuleData>, params: SearchQueryParams): void {
    const searchObservable =
      this.vespaService.getSearchResultsByParams(params.createHttpParams());
    searchObservable.subscribe(
      response => {
        console.log('searchObservable success');
        console.log(response);
        if (params.document) {
          subscriber.next(
            new SwitchModuleData(
              params.getQueries(), response, params.moduleData?.language, params.document, params.moduleData?.getStemFilters()
            )
          );
        } else {
          subscriber.next(
            new SearchModuleData(params.getQueries(), response, params.moduleData?.language, params.moduleData?.getStemFilters())
          );
        }
      },
      _ => subscriber.error(_)
    );
  }

  private sendSearchEvent(params: SearchQueryParams, moduleData?: ModuleData): void {
    let eventParams = {
      query: JSON.stringify(params.queries),
      search_origin: params.searchOrigin,
      search_type: params.searchType,
    };

    if (params.document) {
      const docParams = {
        doc_id: params.document.documentid,
        doc_name: params.document.parent_doc,
        doc_language: params.document.language,
        doc_page: params.document.page,
        ...eventParams
      };
      eventParams = {...eventParams, ...docParams};
    }

    moduleData = moduleData ? moduleData : params.moduleData;

    this.analyticsService.sendSearchEvent(eventParams, moduleData);
  }

  search(params: SearchQueryParams): Observable<ModuleData> {
    switch (params.searchType) {
      case SearchType.normal:
        return this.processNormalSearch(params).pipe();
      case SearchType.filter:
        return this.processFilterSearch(params).pipe();
      case SearchType.stemFilter:
        return this.processStemFilterSearch(params).pipe();
    }
  }
}
