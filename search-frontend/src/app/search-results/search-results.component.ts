import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, DoCheck, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { Globals } from '../globals';
import { SearchModuleData } from '../model/ModuleData';
import { SearchResultItem } from '../model/SearchResultItem';
import { VespaService } from '../service/vespa.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, AfterViewInit, DoCheck{
  @Input() data?: SearchModuleData;
  @Input() inViewport?: boolean;
  @Output() termsSelected = new EventEmitter<string>();
  @Output() resultItemClicked = new EventEmitter<SearchResultItem>();
  @ViewChild('tooltipDiv', { static: false }) tooltipDiv?: ElementRef;
  @Output() scrolled = new EventEmitter();
  @ViewChild(CdkVirtualScrollViewport)
  viewport!: CdkVirtualScrollViewport;

  selectedText: string | undefined = '';
  lastMouseDown?: MouseEvent;
  lastMouseUp?: MouseEvent;
  lastScrollEnd = 0;
  lastLang = '';

  constructor(
    public globals: Globals,
    public vespaService: VespaService,
    private router: Router,
    private toastr: ToastrService,
    private clipboardService: ClipboardService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.viewport.elementScrolled().subscribe(event => {
      this.handler(event);
    });
  }

  public ngDoCheck(): void {
    if (this.data) {
      if (this.lastLang !== this.data?.language) {
        this.lastLang = this.data?.language;
        this.lastScrollEnd = 0;
      }
    }
  }

  handler(event: any): void {
    // console.log(event);
    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    console.log(`${end}, '>=', ${total}`);
    if (end === total) {
      if (this.lastScrollEnd !== end) {
        this.lastScrollEnd = end;
        this.scrolled.emit();
      }
    }
  }

  getSnippets(docName: string, page: number): any {
    if (this.data?.snippets && docName in this.data.snippets && page in this.data.snippets[docName]) {
      return this.data.snippets[docName][page];
    }
    return [];
  }

  getBoundingBoxes(docName: string, page: number): any {
    if (this.data?.result?.boundingBoxes) {
      return this.data?.result.boundingBoxes[docName][page];
    }
  }

  getRelevantTerms(docName: string, page: number): any[]{
    const stems = this.data?.result?.queryMetadata.translations.stems;
    const pageStems = this.data?.result?.boundingBoxes[docName][page].stems;
    const terms: any[] = [];
    stems?.forEach(element => {
      if (pageStems[element]) {
        terms.push(...pageStems[element]);
      }
    });
    return terms;
  }

  hasHits(): boolean {
    if (this.data?.result && this.data?.result.hits) {
      // console.log(this.result.hits.length);
      return this.data?.result.hits.length > 0;
    }
    return false;
  }

  onClick(item: SearchResultItem): void {
    // ignore click if text is selected
    if (!document.getSelection()?.toString()) {
      this.resultItemClicked.emit(item);
    }
  }

  onDownloadClick(event: Event, document: string): void {
    event.stopPropagation();
  }

  onMouseUp(event: MouseEvent): void {
    console.log('mouseup:');
    console.log(event);
    if (window.getSelection) {
        this.selectedText = window.getSelection()?.toString();
        if (this.selectedText) {
          console.log('selected text: ' + this.selectedText);
          // this.textSelected.emit(text);
          this.lastMouseUp = event;
        }
        this.toggleTooltip();
    }
  }

  onMouseDown(event: MouseEvent): void {
    console.log('mousedown:');
    console.log(event);
    this.lastMouseDown = event;
    this.clearTextSelection();
  }

  onScroll(): void {
    this.scrolled.emit();
  }

  onTooltipSearch(): void {
    this.termsSelected.emit(this.selectedText?.replace(/\n/g, ' '));
    this.clearTextSelection();
    this.toggleTooltip();
  }

  onTooltipCopy(): void {
    if (this.selectedText) {
      const text = this.selectedText.replace(/\n/g, ' ');
      this.clipboardService.copy(text);
      this.clearTextSelection();
      this.toggleTooltip();
      this.toastr.success('Text copied to clipboard!');
    }
  }

  toggleTooltip(): void {
    const elem = this.tooltipDiv?.nativeElement as HTMLDivElement;
    if (this.selectedText) {
      if (this.lastMouseUp && this.lastMouseDown) {
        elem.style.display = 'block';
        elem.style.position = 'absolute';
        const left = (this.lastMouseUp?.pageX + this.lastMouseDown?.pageX - elem.clientWidth) / 2 - 320;
        const top = Math.min(this.lastMouseUp.pageY, this.lastMouseDown.pageY) - 10 - elem.clientHeight - 100;
        elem.style.top = top + 'px';
        elem.style.left = left + 'px';
        console.log(elem);
      }
    } else {
      elem.style.display = 'none';
    }
  }

  private clearTextSelection(): void {
    if (window.getSelection) {
      if (window.getSelection()?.empty) {  // Chrome
        window.getSelection()?.empty();
      } else if (window.getSelection()?.removeAllRanges) {  // Firefox
        window.getSelection()?.removeAllRanges();
      }
    }
    this.selectedText = '';
  }
}
