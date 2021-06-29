import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Globals } from './globals';
import { SearchResult } from './model/SearchResult';
import { SearchModuleData, DocumentModuleData, ModuleData, ModuleType } from './model/ModuleData';
import { VespaService } from './service/vespa.service';
import { SearchResultItem } from './model/SearchResultItem';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ArchAIvist';
  searchText = '';
  private prevSearchText = '';
  prevLanguage = '';

  modules: ModuleData[] = [];
  moduleType = ModuleType;
  modulesInViewPort: boolean[] = [];

  multiModules = true;
  sort = 0;

  constructor(
    private vespaService: VespaService,
    public globals: Globals,
    public router: Router
  ) { }

  ngOnInit(): void {
    console.log('I\'m alive!');
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
      console.log('searchBar not null');
      fromEvent(searchBar, 'keyup').pipe(debounceTime(500)).subscribe(x => this.onSearchKeyUp());
    }
  }

  onSearchKeyUp(): void {
    if (this.searchText === '' || this.prevSearchText === this.searchText) {
      return;
    }

    const language = this.prevLanguage;
    this.prevLanguage = '';
    const page = 0;

    this.prevSearchText = this.searchText;
    console.log('Searching for ' + this.searchText);
    const searchObservable =
    this.vespaService.getSearchResults(this.searchText, page, language);
    searchObservable.subscribe(
      response => {
        console.log('searchObservable success');
        console.log(response);
        const searchModuleData = new SearchModuleData(this.searchText, response, language);
        this.modules.push(searchModuleData);
        this.modulesInViewPort.push(false);
        this.buildSnippets(searchModuleData, response.hits, response.queryMetadata.translations.stems);
      },
      error => {
        console.log(`event observable error`);
        console.log(error);
      }
    );
  }

  onLanguageFilter(language: any, index: number): void{
    // Reset page counter
    const moduleData = this.modules[index];
    moduleData.page = 0;
    // window.scrollTo(0, 0);
    moduleData.language = language;
    console.log('Filtering language: ' + moduleData.language);
    const searchObservable = this.vespaService.getSearchResults(this.searchText, moduleData.page, moduleData.language);
    searchObservable.subscribe(
      response => {
        console.log(`searchObservable success`);
        console.log(response);
        if (moduleData && moduleData.result?.hits && response?.hits) {
          moduleData.result = response;
          this.buildSnippets(moduleData, response.hits, response.queryMetadata.translations.stems);
        }
      },
      error => {
        console.log(`event observable error`);
        console.log(error);
      }
    );
  }

  onScroll(index: number): void {
    console.log('onScroll', index);
    const moduleData = this.modules[index];
    if (moduleData.type !== ModuleType.Search) {
      return;
    }
    moduleData.page++;
    console.log('Loading page ' + moduleData.page);
    const searchObservable = this.vespaService.getSearchResults(moduleData.query, moduleData.page, moduleData.language);
    searchObservable.subscribe(
      response => {
        console.log(`searchObservable success`);
        console.log(response);
        if (moduleData && moduleData.result?.hits && response?.hits) {
          moduleData.result.hits = moduleData.result.hits?.concat(response.hits);
          moduleData.result.boundingBoxes = this.joinMaps(moduleData.result.boundingBoxes, response.boundingBoxes);
          console.log(moduleData.result);
          this.buildSnippets(moduleData, response.hits, response.queryMetadata.translations.stems);
        }
      },
      error => {
        console.log(`event observable error`);
        console.log(error);
      }
    );
  }

  private joinMaps(maps1: any, maps2: any): any {
    const result = maps1;
    // tslint:disable-next-line:forin
    for (const key in maps2) {
      if (key in maps1) {
        result[key] = Object.assign(maps1[key], maps2[key]);
      } else {
        result[key] = maps2[key];
      }
    }
    return result;
  }

  private buildSnippets(data: ModuleData, hits: SearchResultItem[], stems: string[]): void {
    hits.forEach(hit =>  {
      const snippetObservable = this.vespaService.buildSnippets(hit, stems);
      snippetObservable.subscribe(
        snippetsResponse => {
          this.joinMaps(data.snippets, snippetsResponse);
        }
      );
    });
  }

  onTermsSelected(terms: string, language: string): void {
    this.searchText = terms;
    this.prevLanguage = language;
    this.onSearchKeyUp();
  }

  onResultItemClicked(item: SearchResultItem, searchModuleIndex: number): void {
    const sourceModule = this.modules[searchModuleIndex];
    if (sourceModule.result) {
      this.modules.push(new DocumentModuleData(this.searchText, sourceModule.result, item, sourceModule.language));
      this.modulesInViewPort.push(false);
    }
  }

  onCloseHistoryItem(index: number, event: Event): void {
    console.log('onCloseHistory');
    event.stopPropagation();
    this.modules.splice(index, 1);
    this.modulesInViewPort.splice(index, 1);
    if (this.modules.length === 0) {
      this.searchText = '';
      this.prevSearchText = '';
    }
  }

  hasHits(index: number): boolean {
    const currentModule = this.modules[index];
    if (currentModule?.result?.hits) {
      // console.log(this.searchResult.hits.length);
      return currentModule.result.hits.length >= 0;
    }
    return false;
  }

  onInViewportChange(index: number, inViewport: boolean): void {
    console.log('onInViewportChange');
    this.modulesInViewPort[index] = inViewport;
  }

  onHistoryClick(index: number): void {
    document.getElementById('item-' + index)?.scrollIntoView({ behavior: 'smooth', inline: 'center'});
  }
}
