import { Component, ElementRef, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SelectionTooltipListener, SelectionTooltipService } from './core/services/selection-tooltip.service';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AnalyticsService } from './core/services/analytics.service';

import { Globals } from './core/constants/globals';
import { VespaService } from './search/services/vespa.service';
import { SearchResult } from './core/models/SearchResult';
import { SearchModuleData, DocumentModuleData, ModuleData, ModuleType, SwitchModuleData } from './core/models/ModuleData';
import { SearchResultItem } from './core/models/SearchResultItem';
import { Document } from './core/models/Document';
import { SearchType } from './core/enums/SearchType';
import { InfoModalContentComponent } from './search/components/info-modal-content/info-modal-content.component';
import { SearchService } from './search/services/search.service';
import { SearchQueryParams } from './search/models/SearchQueryParams';
import { RemoveFilterArgs } from './search/stem-filter/stem-filter.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, SelectionTooltipListener{

  @ViewChild('tooltipDiv', { static: false }) tooltipDiv?: ElementRef;

  searchText = '';
  private prevSearchText = '';
  private prevSearchType: SearchType = SearchType.normal;

  relevantBoxSelected = false;

  modules: ModuleData[] = [];
  moduleType = ModuleType;
  modulesInViewPort: boolean[] = [];

  multiModules = true;
  multiTransitioning = false;

  constructor(
    private vespaService: VespaService,
    private selectionTooltipService: SelectionTooltipService,
    public globals: Globals,
    public router: Router,
    private clipboardService: ClipboardService,
    private  toastr: ToastrService,
    private modalService: NgbModal,
    private analyticsService: AnalyticsService,
    private searchService: SearchService
  ) {
    selectionTooltipService.addListener(this);
  }

  ngOnInit(): void {
    console.log('I\'m alive!');
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
      console.log('searchBar not null');
      fromEvent(searchBar, 'keyup').pipe(debounceTime(700)).subscribe(x => this.onSearchKeyUp());
    }
  }

  containerClick(): void {
    this.selectionTooltipService.toggleTooltip();
  }

  handleError(error: any): void {
    console.log(`event observable error`);
    console.log(error);
    if (error.status === 504) {
      this.toastr.error('Query timed out on server!');
    } else {
      this.toastr.error('Something went wrong!');
    }
  }

  onSearchKeyUp(searchOrigin = 'search-bar', searchType: SearchType = SearchType.normal): void {
    if ((this.searchText === '' || this.prevSearchText === this.searchText) && this.prevSearchType === searchType) {
      return;
    }

    this.prevSearchText = this.searchText;
    this.prevSearchType = searchType;

    const searchObservable =
    this.searchService.search(SearchQueryParams.fromQuery(this.searchText, searchOrigin, searchType));
    searchObservable.subscribe( data => {
      this.modules.push(data);
      this.modulesInViewPort.push(false);
      this.buildSnippets(data);
    });
  }

  private reloadModule(moduleData: ModuleData): void {
    // Reset page counter
    moduleData.page = 0;
    moduleData.snippets = {};
    moduleData.snippetLessHits = 0;
    const searchObservable = this.searchService.search(SearchQueryParams.fromModuleData(moduleData));
    searchObservable.subscribe(
      data => {
        console.log(`searchObservable success`);
        console.log(data.result);
        if (moduleData && moduleData.result?.hits && data.result?.hits) {
          moduleData.result = data.result;
          this.buildSnippets(moduleData);
        }
      },
      error => this.handleError(error)
    );
  }

  onStemFilterRemove(eventArgs: RemoveFilterArgs, moduleData: ModuleData): void {
    const stem = moduleData.removeStemFilter(eventArgs.language, eventArgs.index);
    this.reloadModule(moduleData);
    this.analyticsService.sendEvent('remove_stemfilter', {
      stem,
      language: eventArgs.language,
      ...moduleData.getAnalyticsPayload()
    });
  }

  onLanguageFilter(language: any, index: number): void{
    const moduleData = this.modules[index];
    moduleData.language = language;
    console.log('Filtering language: ' + moduleData.language);
    this.reloadModule(moduleData);

    this.analyticsService.sendEvent('filter_language', {
      module_language: language === '' ? 'all' : language,
      ...moduleData.getAnalyticsPayload()
    });
  }

  onSort(moduleIndex: number, orderBy: string, direction: string): void {
    const moduleData = this.getModule(moduleIndex);
    console.log(`Sorting by:  ${orderBy === '' ? 'relevance' : orderBy} order: ${direction}`);
    moduleData.orderBy = orderBy;
    moduleData.direction = direction;
    this.reloadModule(moduleData);

    this.analyticsService.sendEvent('sort', {
      order_by: orderBy === '' ? 'relevance' : orderBy,
      direction,
      ...moduleData.getAnalyticsPayload()
    });
  }

  onScroll(index: number): void {
    console.log('onScroll', index);
    const moduleData = this.getModule(index);
    if (moduleData.type !== ModuleType.Search && moduleData.type !== ModuleType.DocumentSearch) {
      return;
    }
    // const document = moduleData instanceof SwitchModuleData ? moduleData.document.parent_doc : '';
    moduleData.page++;
    console.log('Loading page ' + moduleData.page);
    const searchObservable = this.searchService.search(SearchQueryParams.fromModuleData(moduleData));
    searchObservable.subscribe(
      data => {
        console.log(`searchObservable success`);
        const result = data.result;
        console.log(result);
        if (moduleData && moduleData.result?.hits && result?.hits) {
          moduleData.result.hits = moduleData.result.hits?.concat(result.hits);
          moduleData.result.boundingBoxes = this.joinMaps(moduleData.result.boundingBoxes, result.boundingBoxes);
          console.log(moduleData.result);
          this.buildSnippets(moduleData, result);
        }
      },
      error => this.handleError(error)
    );
  }

  toggleMultiModules(value: boolean): void {
    if (this.multiModules !== value) {
      this.multiModules = value;
      this.analyticsService.sendEvent('mode_switch', {
        mode: value ? 'explore (multi)' : 'focus (single)',
        module_count: this.modules.length
      });

      // Scroll to first visible index to avoid positions between modules
      this.multiTransitioning = true;
      const firstVisibleIndex = this.modulesInViewPort.findIndex((elem) => elem);
      console.log('First visible index:' + firstVisibleIndex);
      setTimeout(() => {
        document.getElementById('item-' + firstVisibleIndex)?.scrollIntoView({ behavior: 'auto', inline: 'start'});
        this.multiTransitioning = false;
      }, 100);
    }
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

  private buildSnippets(data: ModuleData, result?: SearchResult): void {
    let stems = {};
    const synonyms: any[] = [];
    if (!result) {
      result = data.result;
    }
    result.queryMetadata.translations.forEach(phraseTranslations => {
      stems = Object.assign(stems, phraseTranslations.stems);
      synonyms.push(...phraseTranslations.synonyms);
    });

    result.hits.forEach(hit =>  {
      const snippetObservable = this.vespaService.buildSnippets(
        hit,
        stems,
        synonyms,
        data.getLanguageStemFilters(hit.fields.language)
      );
      snippetObservable.subscribe(
        (snippetsResponse: any) => {
          this.joinMaps(data.snippets, snippetsResponse);
          const doc = hit.fields.parent_doc;
          const page = hit.fields.page;
          if (snippetsResponse[doc][page].names.length === 0) {
            data.result.hits = data.result.hits.filter(snippetHit => {
              return snippetHit.fields.parent_doc !== doc || snippetHit.fields.page !== page;
            });
            data.snippetLessHits += 1;
            console.log(`Found empty snippets for item ${doc} ${page}`);
            console.log(data.result.hits);
          }
        }
      );
    });
  }

  private getModule(index: number): ModuleData {
    let moduleData = this.modules[index];
    if (moduleData.switchModule) {
      moduleData = moduleData.switchModule;
    }
    return moduleData;
  }

  onResultItemClicked(item: SearchResultItem, searchModuleIndex: number): void {
    const sourceModule = this.getModule(searchModuleIndex);

    this.analyticsService.sendEvent('detail_view', {
      ...sourceModule.getAnalyticsPayload(),
      doc_id: item.fields.documentid,
      doc_name: item.fields.parent_doc,
      doc_language: item.fields.language,
      doc_page: item.fields.page,
      doc_collection: item.fields.collection,
      module_count: this.modules.length
    });

    if (sourceModule.result) {
      this.modules.splice(searchModuleIndex + 1, 0,
        new DocumentModuleData(sourceModule.queries, sourceModule.result, item, sourceModule.language));
      // this.modules.push(new DocumentModuleData(this.searchText, sourceModule.result, item, sourceModule.language));
      this.modulesInViewPort.splice(searchModuleIndex + 1, 0, false);
    }
  }

  onCloseHistoryItem(index: number, event: Event): void {
    console.log('onCloseHistory');
    event.stopPropagation();

    this.analyticsService.sendEvent('history_delete',
      {...this.modules[index].getAnalyticsPayload(), module_count: this.modules.length}
    );

    this.modules.splice(index, 1);
    this.modulesInViewPort.splice(index, 1);
    if (this.modules.length === 0) {
      this.searchText = '';
      this.prevSearchText = '';
    }
  }

  hasHits(index: number): boolean {
    const currentModule = this.getModule(index);

    if (currentModule?.result?.hits) {
      // console.log(this.searchResult.hits.length);
      return currentModule.result.hits.length >= 0;
    }
    return false;
  }

  onInViewportChange(index: number, inViewport: boolean): void {
    console.log('onInViewportChange');
    this.modulesInViewPort[index] = inViewport;
    this.hideTooltip(true);
    document.querySelector('.history-item.active')?.scrollIntoView({ behavior: 'smooth', block: 'center'});
  }

  onModeSwitch(multiEnable: boolean): void {
    this.multiModules = multiEnable;
    this.hideTooltip(true);
  }

  onHistoryClick(index: number): void {
    document.getElementById('item-' + index)?.scrollIntoView({ behavior: 'smooth', inline: 'center'});

    this.analyticsService.sendEvent('history_click',
      {...this.modules[index].getAnalyticsPayload(), module_count: this.modules.length}
    );
  }

  onDocumentSearch(document: Document, index: number): void {
    const moduleData = this.getModule(index);

    this.searchService.search(SearchQueryParams.fromModuleData(moduleData, 'document', SearchType.normal, document)).subscribe(
      data => {
        console.log(`searchObservable success`);
        console.log(data.result);

        this.modules.splice(index + 1, 0, data);
        this.modulesInViewPort.splice(index + 1, 0, false);
        this.buildSnippets(data);
      },
      error => this.handleError(error)
    );
  }

  onSwitchBack(index: number): void {
    this.modules[index].switchModule = undefined;
    console.log(this.modules[index]);
  }

  toggleTooltip(): void {
    const tooltip = this.tooltipDiv?.nativeElement as HTMLDivElement;
    const selection = window.getSelection();
    this.relevantBoxSelected = false;

    if (selection) {
      // TODO check for relevant/synonym items here and adjust anchorRect+focusRect accordingly

      const selectedText = this.selectionTooltipService.getSelectedText();
      let anchorElem = selection.anchorNode as HTMLElement;
      let focusElem = selection.focusNode as HTMLElement;
      const relevantElem = this.getRelevantSelectionElement(selection);
      if (relevantElem && selectedText) {
        this.relevantBoxSelected = true;
        anchorElem = focusElem = relevantElem;
      }

      const anchorRect = anchorElem?.firstElementChild?.getBoundingClientRect();
      const focusRect = focusElem?.firstElementChild?.getBoundingClientRect();
      if (selectedText && anchorRect && focusRect) {
        tooltip.style.display = 'block';
        const leftMost = Math.min(anchorRect.left, focusRect?.right);
        const rightMost = Math.max(anchorRect.left + anchorRect.width, focusRect.left + focusRect.width);
        const left = (leftMost + rightMost - tooltip.clientWidth) / 2;
        const top = Math.min(anchorRect.top, focusRect.top) - tooltip.clientHeight - 5;
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      } else {
        tooltip.style.display = 'none';
        this.selectionTooltipService.clearTextSelection();
      }
    }
  }

  private getRelevantSelectionElement(selection: Selection): HTMLElement | undefined {
    const anchorElem = selection.anchorNode as HTMLElement;
    const focusElem = selection.focusNode as HTMLElement;

    if (anchorElem && anchorElem === focusElem && anchorElem.parentElement) {
      if (anchorElem.classList?.contains('relevant') || anchorElem.classList?.contains('synonym')) {
        return anchorElem;
      }
      if (anchorElem.parentElement?.classList?.contains('relevant') || anchorElem.parentElement?.classList?.contains('synonym')) {
        return anchorElem.parentElement;
      }
    }
    return;
  }

  hideTooltip(shouldClearText = true): void {
    if (shouldClearText) {
      this.selectionTooltipService.clearTextSelection();
    }
    const tooltip = this.tooltipDiv?.nativeElement as HTMLElement;
    tooltip.style.display = 'none';
  }

  onTooltipSearch(): void {
    let selectedText = this.selectionTooltipService.getSelectedText();
    selectedText = selectedText ? selectedText : this.selectionTooltipService.previousSelection;
    if (selectedText) {
      this.searchText = selectedText.replace(/\s/g, ' ');
      this.searchText = this.searchText.trim();
      // this.prevLanguage = this.selectionTooltipService.previousLanguage;
      this.onSearchKeyUp('tooltip');
      this.selectionTooltipService.clearTextSelection(true);
      this.toggleTooltip();
    }
  }

  onTooltipFilter(): void {
    let selectedText = this.selectionTooltipService.getSelectedText();
    selectedText = selectedText ? selectedText : this.selectionTooltipService.previousSelection;
    if (selectedText) {
      this.searchText = selectedText.replace(/\s/g, ' ');
      this.searchText = this.searchText.trim();
      // this.prevLanguage = this.selectionTooltipService.previousLanguage;
      this.onSearchKeyUp('tooltip', SearchType.filter);
      this.selectionTooltipService.clearTextSelection(true);
      this.toggleTooltip();
    }
  }

  onTooltipCopy(): void {
    let selectedText = this.selectionTooltipService.getSelectedText();
    selectedText = selectedText ? selectedText : this.selectionTooltipService.previousSelection;
    if (selectedText) {
      this.analyticsService.sendEvent('tooltip_copy', {
        ...this.selectionTooltipService.getPreviousModule()?.getAnalyticsPayload(),
        text: selectedText
      });
      this.clipboardService.copy(selectedText);
      this.selectionTooltipService.clearTextSelection();
      this.toggleTooltip();
      this.toastr.success('Text copied to clipboard!');
    }
  }

  onTooltipStemFilter(): void {
    // Reset page counter
    const moduleData = this.getModule(this.selectionTooltipService.getSelectionModuleIndex());
    moduleData.page = 0;
    moduleData.snippets = {};
    moduleData.snippetLessHits = 0;
    // const document = moduleData instanceof SwitchModuleData ? moduleData.document.parent_doc : '';
    const searchObservable = this.searchService.search(SearchQueryParams.fromSearchMeta('tooltip', SearchType.stemFilter));
    searchObservable.subscribe(
      data => {
        console.log(`searchObservable success`);
        console.log(data.result);
        if (moduleData && moduleData.result?.hits && data.result?.hits) {
          moduleData.setStemFilters(data.getStemFilters());
          moduleData.result = data.result;
          this.buildSnippets(moduleData);
        }
      },
      error => this.handleError(error)
    );
    this.selectionTooltipService.clearTextSelection(true);
    this.toggleTooltip();
  }


  infoClick(data: ModuleData): void {
    const modalRef = this.modalService.open(InfoModalContentComponent);
    modalRef.componentInstance.data = data;

    this.analyticsService.sendEvent('meta_info_click', {
      query: JSON.stringify(data.queries),
      detected_language: data.result.queryMetadata.translations.map(phraseTranslations => phraseTranslations.sourceLanguage).join(',')
    });
  }
}
