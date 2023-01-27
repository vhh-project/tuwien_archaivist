import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoundedImageViewerComponent } from '../bounded-image-viewer/bounded-image-viewer.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { DocumentModuleData } from 'src/app/core/models/ModuleData';
import { PageResult } from 'src/app/core/models/PageResult';
import { Globals } from 'src/app/core/constants/globals';
import { VespaService } from 'src/app/search/services/vespa.service';
import { SelectionTooltipService } from 'src/app/core/services/selection-tooltip.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { Document } from 'src/app/core/models/Document';

@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit, AfterViewInit{
  @Input() data!: DocumentModuleData;
  @Input() inViewport?: boolean;
  @Output() documentSearchStarted = new EventEmitter<Document>();

  @ViewChild('docImage', { static: false }) docImage?: ElementRef;

  @ViewChild(BoundedImageViewerComponent, { static: false }) private boundedImageViewerComponent?: BoundedImageViewerComponent;
  @ViewChild(CdkScrollable)
  scrollable!: CdkScrollable;

  docName: any;
  docPage: any;
  page = 0;
  language = '';
  selectedText = '';
  boundingData: any;
  terms: any;

  previousPageData!: PageResult;
  nextPageData!: PageResult;

  constructor(
    public globals: Globals,
    private route: ActivatedRoute,
    public vespaService: VespaService,
    private selectionTooltipService: SelectionTooltipService,
    private analyticsService: AnalyticsService
  ) { }

  ngOnInit(): void {
    this.docName = this.data?.resultItem?.fields.parent_doc;
    this.docPage = this.data?.resultItem?.fields.page;

    this.boundingData = this.data?.result?.boundingBoxes[this.docName][this.docPage];
    this.terms = [];
    this.data?.result?.queryMetadata.translations.forEach(phraseTranslations => {
      this.terms.push(...phraseTranslations.flatTerms);
    });

    this.loadPreviousPage();
    this.loadNextPage();
  }

  ngAfterViewInit(): void {
    this.scrollable.elementScrolled().subscribe(position => {
      this.selectionTooltipService.clearTextSelection(true);
      this.selectionTooltipService.toggleTooltip();
    });
  }

  onTitleClick(): void {
    if (this.data) {
      this.documentSearchStarted.emit(this.data.resultItem?.fields);
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

    // clear tooltip selection
    this.selectionTooltipService.clearTextSelection(true);
    this.selectionTooltipService.toggleTooltip();
  }

  previousPage(): void {
    this.analyticsService.sendEvent('page_navigation', {
      ...this.data.getAnalyticsPayload(),
      type: 'back'
    });
    this.updatePageData(-1, this.previousPageData);
  }

  nextPage(): void {
    this.analyticsService.sendEvent('page_navigation', {
      ...this.data.getAnalyticsPayload(),
      type: 'forward'
    });
    this.updatePageData(+1, this.nextPageData);
  }

  updatePageData(modifier: number, pageData: PageResult): void {
    this.boundingData = pageData.boundingData;
    this.docPage += modifier;
    this.data.resultItem = pageData.item;
    this.loadPreviousPage();
    this.loadNextPage();
  }

  private loadPreviousPage(): void {
    const previousPageObservable = this.vespaService.getDocumentPageData(this.docName, this.docPage - 1);
    previousPageObservable.subscribe(
      data => {
        this.previousPageData = data;
        console.log('getDocumentPageData');
        console.log(data);
      }
    );
  }

  private loadNextPage(): void {
    const nextPageObservable = this.vespaService.getDocumentPageData(this.docName, this.docPage + 1);
    nextPageObservable.subscribe(
      data => {
        this.nextPageData = data;
        console.log('getDocumentPageData');
        console.log(data);
      }
    );
  }
}
