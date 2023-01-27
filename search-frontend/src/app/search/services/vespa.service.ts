import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResult } from '../../core/models/SearchResult';
import { SearchResultItem } from '../../core/models/SearchResultItem';
import { PageResult } from '../../core/models/PageResult';
import { QueryMetadata } from '../../core/models/QueryMetadata';


@Injectable({
  providedIn: 'root'
})
export class VespaService {

  private URL = 'http://localhost:2346/';


  constructor(private http: HttpClient) { }

  getSearchResults(
    queries: string[],
    page: number = 0,
    language: string = '',
    document: string = '',
    orderBy: string = '',
    direction = 'desc'
  ): Observable<SearchResult> {
    return this.http.get<SearchResult>(this.URL + 'search/', {
      params: new HttpParams()
        .set('query', JSON.stringify(queries))
        .set('page', page.toString())
        .set('language', language)
        .set('hits', '10')
        .set('document', document)
        .set('order_by', orderBy)
        .set('direction', direction)
    });
  }

  getSearchResultsByParams(
    params: HttpParams
  ): Observable<SearchResult> {
    return this.http.get<SearchResult>(this.URL + 'search/', {
      params
    });
  }

  buildSnippets(hit: SearchResultItem, stems: any, synonyms: any[], stemFilters: string[]): Observable<string[]> {
    return this.http.post<string[]>(this.URL + 'snippets/', {
      hit,
      stems,
      synonyms,
      'stem-filters': stemFilters
    });
  }

  buildBoundingBoxContent(
    language: string, boundingData: any, metaData: QueryMetadata, stemFilters: string[], surroundingBox?: any
  ): Observable<any> {
    return this.http.post<any>(this.URL + 'bounding-boxes/', {
      language,
      'bounding-data': boundingData,
      'meta-data': metaData,
      'surrounding-box': surroundingBox,
      'stem-filters': stemFilters
    });
  }

  getSnippetURL(snippetName: string): string {
    return this.URL + 'snippet/' + snippetName;
  }

  getDocumentPageData(docName: string, page: number): Observable<any> {
    return this.http.get<PageResult>(this.URL + 'document/' + docName + '/page/' + page);
  }

  getDocumentPageImageURL(docName: string, page: number): string {
    return this.URL + 'document/' + docName + '/page/' + page + '/image';
  }

  downloadDocumentFileURL(docName: string): any {
    return this.URL + 'document/' + docName + '/download';
  }

}

