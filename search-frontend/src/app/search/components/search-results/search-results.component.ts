import { Component, DoCheck, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IPageInfo, VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Globals } from 'src/app/core/constants/globals';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

import { SelectionTooltipService } from 'src/app/core/services/selection-tooltip.service';
import { Document } from 'src/app/core/models/Document';
import { SearchModuleData, SwitchModuleData } from 'src/app/core/models/ModuleData';
import { SearchResultItem } from 'src/app/core/models/SearchResultItem';
import { VespaService } from 'src/app/search/services/vespa.service';
import { BoundingBoxService } from '../../services/bounding-box.service';
import { StemFilter } from 'src/app/core/models/StemFilter';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements DoCheck{
  @Input() data!: SearchModuleData;
  @Input() inViewport?: boolean;
  @Output() resultItemClicked = new EventEmitter<SearchResultItem>();
  @Output() scrolled = new EventEmitter();
  @Output() documentSearchStarted = new EventEmitter<Document>();
  @ViewChild('tooltipDiv', { static: false }) tooltipDiv?: ElementRef;
  @ViewChild(VirtualScrollerComponent)
  private virtualScroller!: VirtualScrollerComponent;

  selectedText: string | undefined = '';
  lastScrollEnd = 0;
  lastLang = '';
  lastOrderBy = '';
  lastStemFilter: StemFilter[] = [];
  lastDirection = 'desc';
  lastPage = 0;
  switched = false;
  language = '';

  constructor(
    public globals: Globals,
    public vespaService: VespaService,
    public boundingBoxService: BoundingBoxService,
    public selectionTooltipService: SelectionTooltipService,
    private analyticsService: AnalyticsService) { }

  public ngDoCheck(): void {
    if (this.data) {
      this.language = this.data.language;
      if (this.data instanceof SwitchModuleData) {
        this.switched = true;
      }
      if (this.lastPage !== this.data.page) {
        this.lastPage = this.data.page;
        if (this.data.page === 0) {
          this.virtualScroller?.scrollToPosition(0);
          this.lastScrollEnd = 0;
        }
      }
      if (this.lastLang !== this.data.language) {
        this.lastLang = this.data.language;
      } else if (this.lastOrderBy !== this.data.orderBy || this.lastDirection !== this.data.direction) {
        this.lastOrderBy = this.data.orderBy;
        this.lastDirection = this.data.direction;
      } else if (!this.stemFiltersEquals(this.lastStemFilter, this.data.getStemFilters())) {
        this.lastStemFilter = this.data.getStemFilters();
      }
    }
  }

  stemFiltersEquals(stemFilters1: StemFilter[], stemFilters2: StemFilter[]): boolean {
    const sum1 = stemFilters1.reduce((total, stemFilter) => {
      return total + stemFilter.getStems().length;
    }, 0);

    const sum2 = stemFilters2.reduce((total, stemFilter) => {
      return total + stemFilter.getStems().length;
    }, 0);

    return sum1 === sum2;
  }

  fetchMore(event: IPageInfo): void {
    const hits = this.data.result.hits;
    const end = event.endIndex;
    // console.log(`fetchMore: ${end + 1}/${hits.length}`);
    this.selectionTooltipService.clearTextSelection(true);
    this.selectionTooltipService.toggleTooltip();
    if (end !== hits.length - 1) { return; }
    if (this.lastScrollEnd !== end) {
      this.lastScrollEnd = end;
      this.scrolled.emit();
    }
  }

  getSnippets(docName: string, page: number): any {
    if (this.data?.snippets && docName in this.data.snippets && page in this.data.snippets[docName]) {
      return this.data.snippets[docName][page];
    }
    return {};
  }

  getBoundingBoxes(docName: string, page: number): any {
    if (this.data?.result?.boundingBoxes) {
      return this.data?.result.boundingBoxes[docName][page];
    }
  }

  hasHits(): boolean {
    if (this.data?.result && this.data?.result.hits) {
      // console.log(this.result.hits.length);
      return this.data?.result.hits.length > 0;
    }
    return false;
  }

  onClick(event: Event, item: SearchResultItem): void {
    // ignore click if text is selected
    if (!document.getSelection()?.toString()) {
      const target = event.target as HTMLElement;
      if (target.classList.contains('relevant') || target.parentElement?.classList.contains('relevant') ||
      target.classList.contains('synonym') || target.parentElement?.classList.contains('synonym') ) {
        console.log('Relevant term clicked!', event);
        const selection = window.getSelection();
        const range = document.createRange();
        const end = target;
        range.setStart(target, 0);
        range.setEnd(target, 1);
        selection?.removeAllRanges();
        selection?.addRange(range);
        this.selectionTooltipService.toggleTooltip(item.fields.language, this.data);
        // TODO send analytics event here!
        return;
      }
      this.resultItemClicked.emit(item);
    }
  }

  onDownloadClick(event: Event, document: Document): void {
    event.stopPropagation();

    this.analyticsService.sendEvent('download', {
      doc_id: document.documentid,
      doc_name: document.parent_doc,
      doc_language: document.language,
      doc_page: document.page,
      query: JSON.stringify(this.data?.queries)
    });
  }

  onSnippetSummaryClick(event: Event, document: Document): void {
    event.stopPropagation();

    this.boundingBoxService.copySnippetsText(
      document,
      this.getBoundingBoxes(document.parent_doc, document.page).boxes,
      this.getSnippets(document.parent_doc, document.page).boxes);

    this.analyticsService.sendEvent('snippet_summary', {
      doc_id: document.documentid,
      doc_name: document.parent_doc,
      doc_language: document.language,
      doc_page: document.page,
      query: JSON.stringify(this.data?.queries)
    });
  }

  onTitleClick(event: Event, document: Document): void {
    if (this.switched) {
      return;
    }
    event.stopPropagation();
    console.log('onTitleClick');
    if (this.data) {
      this.documentSearchStarted.emit(document);
    }
  }

  onMouseUp(event: MouseEvent): void {
    console.log('mouseup:');
    console.log(event);
    const selectedText = this.selectionTooltipService.getSelectedText();
    if (selectedText) {
      console.log('selected text: ' + selectedText);
      this.analyticsService.sendEvent('text_selection', {
        ...this.data.getAnalyticsPayload(),
        text: selectedText.replace(/\s/g, ' ').trim()
      });

      this.selectionTooltipService.toggleTooltip(this.language, this.data);
    }
  }

  onMouseDown(event: MouseEvent): void {
    console.log('mousedown:');
    console.log(event);
    this.selectionTooltipService.clearTextSelection(true);
    this.selectionTooltipService.toggleTooltip();
  }
}
