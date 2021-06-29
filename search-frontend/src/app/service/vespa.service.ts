import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResult } from '../model/SearchResult';
import { SearchResultItem } from '../model/SearchResultItem';

@Injectable({
  providedIn: 'root'
})
export class VespaService {

  private URL = 'http://localhost:5001/';


  constructor(private http: HttpClient) { }

  getSearchResults(query: string, page: number = 0, language: string = ''): Observable<SearchResult> {
    return this.http.get<SearchResult>(this.URL + 'search/', {
      params: new HttpParams()
        .set('query', query)
        .set('page', page.toString())
        .set('language', language)
        .set('hits', '10')
    });
  }

  buildSnippets(hit: SearchResultItem, stems: string[]): Observable<string[]> {
    return this.http.post<string[]>(this.URL + 'snippets/', {
      hit,
      stems
    });
  }

  getSnippetURL(snippetName: string): string {
    return this.URL + 'snippet/' + snippetName;
  }

  getDocumentPageImageURL(docName: string, page: number): string {
    return this.URL + 'document/' + docName + '/page/' + page + '/image';
  }

  downloadDocumentFileURL(docName: string): any {
    return this.URL + 'document/' + docName + '/download';
  }

}

