import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { VespaService } from 'src/app/search/services/vespa.service';
import { ResizedEvent } from 'angular-resize-event';
import { SelectionTooltipService } from 'src/app/core/services/selection-tooltip.service';
import Selection from 'selection-drag';
import { QueryMetadata } from 'src/app/core/models/QueryMetadata';


@Component({
  selector: 'app-bounded-image-viewer',
  templateUrl: './bounded-image-viewer.component.html',
  styleUrls: ['./bounded-image-viewer.component.scss']
})
export class BoundedImageViewerComponent implements AfterViewInit, OnChanges {

  @ViewChild('docImage', { static: false }) docImage?: ElementRef;
  @ViewChild('tooltipDiv', { static: false }) tooltipDiv?: ElementRef;


  @Input() boundingData: any;
  @Input() metaData!: QueryMetadata;
  @Input() docName?: string;
  @Input() docPage?: number;
  @Input() language = '';
  @Input() inViewport?: boolean;
  @Input() stemFilters: string[] = [];

  flatBoundingBoxes: any;
  imageWidth!: number;
  imageHeight!: number;
  scaleWidth!: number;
  scaleHeight!: number;
  resize = false;
  imageLoaded = false;
  boundingBoxContent = '';

  constructor(
    private elementRef: ElementRef,
    public vespaService: VespaService,
    public selectionTooltipService: SelectionTooltipService
    ) { }

  ngAfterViewInit(): void {
    this.initDragSelection('.image-container');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.boundingData) {
      this.initBoxContent();
    }
  }

  protected initBoxContent(): void {
    const boxObservable =
    this.vespaService.buildBoundingBoxContent(this.language, this.boundingData, this.metaData, this.stemFilters);
    boxObservable.subscribe(
      boxResponse => {
        this.boundingBoxContent = boxResponse.content;
        this.resize = !this.resize;
      }
    );
  }

  protected initDragSelection(containerSelector: string, containerRef?: ElementRef): void {
    let containerElem;
    if (containerRef) {
      containerElem = containerRef.nativeElement as HTMLElement;
    } else {
      containerElem = this.elementRef.nativeElement.querySelector(containerSelector) as HTMLElement;
    }

    const sel = Selection({ container: containerElem, targetSelectors: '.bounding-box'});

    sel.rect.addEventListener('_selectstart', e => {
      console.log('started!');
      document.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
    });
    sel.rect.addEventListener('_selectend', e => {
      console.log(e);
      const event = e as CustomEvent;
      let { selectedElements } = event?.detail || {};
      console.log(selectedElements); // use all *active selected elements
      selectedElements = this.sortElementsByPosition(selectedElements);
      console.log(selectedElements); // use all *active selected elements
      if (selectedElements.length > 0) {
        const selection = window.getSelection();
        const range = document.createRange();
        const end = selectedElements[selectedElements.length - 1];
        range.setStart(selectedElements[0], 0);
        range.setEnd(end, end.childNodes.length - 1);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
    sel.rect.addEventListener('_selected', e => {
      console.log(e);
      const event = e as CustomEvent;
      event.detail.addedElement.classList.add('selected'); // add a class to that element
    });
    sel.rect.addEventListener('_removed', e => {
      console.log(e);
      const event = e as CustomEvent;
      event.detail.removedElement.classList.remove('selected'); // remove the added class
    });
  }

  sortElementsByPosition(elements: []): [] {
    return elements.sort((e1: HTMLElement, e2: HTMLElement) => {
      const top1 = e1.offsetTop;
      const top2 = e2.offsetTop;
      const left1 = e1.offsetLeft;
      const left2 = e2.offsetLeft;
      const margin = 2.0;
      const heightDifference = top2 - top1;
      const absHeightDifference = Math.abs(heightDifference);
      if (heightDifference > margin) {
        // first box higher up
        return -1;
      } else if (margin >= absHeightDifference) {
        // approx. same height
        if (left1 < left2) {
          return - 1;
        }
        if (left1 > left2) {
          return 1;
        }
        // same starting position
        return 0;
      } else {
        // second box higher up
        return 1;
      }
    });
  }

  onDocImageLoad(): void {
    this.calcScales();
    this.imageLoaded = true;
  }

  onResize(event: ResizedEvent): void {
    this.calcScales();
    this.selectionTooltipService.clearTextSelection();
    this.selectionTooltipService.toggleTooltip();
    this.resize = !this.resize;
  }

  getScaledXPos(value: any): any {
    if (value) {
      return ((value as number) * this.scaleWidth) / this.imageWidth * 100;
    }
  }

  getScaledYPos(value: any): any {
    if (value) {
      return ((value as number) * this.scaleHeight) / this.imageHeight * 100;
    }
  }

  getLeftOffset(): any {
    return this.docImage?.nativeElement.offsetLeft;
  }

  calcScales(): void {
    this.imageWidth = (this.docImage?.nativeElement as HTMLImageElement).width;
    this.imageHeight = (this.docImage?.nativeElement as HTMLImageElement).height;
    this.scaleWidth = this.imageWidth / this.boundingData.dimensions.origWidth;
    this.scaleHeight = this.imageHeight / this.boundingData.dimensions.origHeight;
  }
}
