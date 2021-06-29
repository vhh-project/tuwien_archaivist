import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  Input, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { VespaService } from '../service/vespa.service';
import { animationFrameScheduler, from, Observable, of, scheduled, Subject } from 'rxjs';
import { bufferCount, concatMap, debounceTime, delay, map, mergeMap, scan, tap } from 'rxjs/operators';
import { ResizedEvent } from 'angular-resize-event';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-bounded-image-viewer',
  templateUrl: './bounded-image-viewer.component.html',
  styleUrls: ['./bounded-image-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoundedImageViewerComponent implements OnInit{

  constructor(
    public vespaService: VespaService,
    public clipboardService: ClipboardService,
    public toastr: ToastrService
    ) { }

  @ViewChild('docImage', { static: false }) docImage?: ElementRef;
  @ViewChild('tooltipDiv', { static: false }) tooltipDiv?: ElementRef;
  @ViewChild('boxContainer', { read: ViewContainerRef }) container?: ViewContainerRef;
  @ViewChild('box', { read: TemplateRef }) template?: TemplateRef<any>;



  @Input() boundingData: any;
  @Input() terms?: Array<string>;
  @Input() docName?: string;
  @Input() docPage?: number;
  @Input() inViewport?: boolean;

  @Output() termsSelected = new EventEmitter<string>();
  @Output() docImageLoaded = new EventEmitter<void>();

  highlightStatus?: Array<boolean>;
  flatBoundingBoxes: Array<any> = [];
  imageWidth?: number;
  imageHeight?: number;
  scaleWidth?: number;
  scaleHeight?: number;
  $subject: Subject<string> = new Subject<string>();
  lastMouseDown?: MouseEvent;
  lastMouseUp?: MouseEvent;
  selectedText: string | undefined = '';
  resize = false;
  currentIndex = 0;
  $boxes?: Observable<Array<any>>;
  imageLoaded = false;

  ngOnInit(): void {
    this.highlightStatus = [this.boundingData.length];
    this.flatBoundingBoxes = this.flattenBoundingBoxes();
    this.$boxes = of(this.flatBoundingBoxes).pipe(
      this.lazyArray(10, 10)
    );
    this
      .$subject
      .pipe(debounceTime(1000))
      .subscribe(
        (event: string) => this.termsSelected.emit(event)
      );
  }

  onDocImageLoad(): void {
    console.log('onDocImageLoad');
    this.calcScales();
    this.docImageLoaded.emit();
    this.imageLoaded = true;
    // this.buildData(this.flatBoundingBoxes.length);
  }

  onResize(event: ResizedEvent): void {
    this.calcScales();
    this.clearTextSelection();
    this.resize = !this.resize;
  }
  getScaledXPos(value: any): any {
    if (value && this.scaleWidth) {
      return (value as number) * this.scaleWidth;
    }
  }

  getScaledYPos(value: any): any {
    if (value && this.scaleHeight) {
      return (value as number) * this.scaleHeight;
    }
  }

  getLeftOffset(): any {
    return this.docImage?.nativeElement.offsetLeft;
  }

  onDocDivClick(index: number): void {
    if (this.highlightStatus) {
      let selectedTerms = '';
      this.highlightStatus[index] = !this.highlightStatus[index];
      this.highlightStatus.forEach((element, i) => {
        if (element === true) {
          selectedTerms += this.flatBoundingBoxes[i].word + ' ';
        }
      });
      this.$subject.next(selectedTerms);
    }
  }

  clearHighlights(): void {
    this.highlightStatus = [this.boundingData.length];
  }

  calcScales(): void {
    this.imageWidth = (this.docImage?.nativeElement as HTMLImageElement).width;
    this.imageHeight = (this.docImage?.nativeElement as HTMLImageElement).height;
    this.scaleWidth = this.imageWidth / this.boundingData.dimensions.origWidth;
    this.scaleHeight = this.imageHeight / this.boundingData.dimensions.origHeight;
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

  toggleTooltip(): void {
    const elem = this.tooltipDiv?.nativeElement as HTMLDivElement;
    if (this.selectedText) {
      if (this.lastMouseUp && this.lastMouseDown) {
        elem.style.display = 'block';
        elem.style.position = 'absolute';
        const left = (this.lastMouseUp?.pageX + this.lastMouseDown?.pageX - elem.clientWidth) / 2;
        const top = Math.min(this.lastMouseUp.pageY, this.lastMouseDown.pageY) - 20 - elem.clientHeight;
        elem.style.top = top + 'px';
        elem.style.left = left + 'px';
        console.log(elem);
      }
    } else {
      elem.style.display = 'none';
    }
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

  private flattenBoundingBoxes(): any {
    const flatBoxes = [];
    const keys = Object.keys(this.boundingData?.boxes);
    // tslint:disable-next-line:forin
    for (const key in keys) {
      const word = keys[key];
      // console.log('Word: ' + word);
      const wordBoxes = this.boundingData.boxes[word];
      // console.log(this.boundingData.boxes[word]);
      // tslint:disable-next-line:forin
      for (const boxKey in wordBoxes) {
        // console.log(wordBoxes[boxKey]);
        flatBoxes.push({word, box: wordBoxes[boxKey]});
      }
    }
    return this.sortBoundingBoxes(flatBoxes);
  }

  private sortBoundingBoxes(boxes: any): any {
    return boxes.sort((o1: {box: number[], word: string}, o2: {box: number[], word: string}) => {
      const b1 = o1.box;
      const b2 = o2.box;
      const margin = 2.0;
      const heightDifference = b1[2] - b2[2];
      const absHeightDifference = Math.abs(heightDifference);
      if (heightDifference > margin) {
        // first box higher up
        return -1;
      } else if (margin >= absHeightDifference) {
        // approx. same height
        if (b1[0] < b2[0]) {
          return - 1;
        }
        if (b1[0] > b2[0]) {
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

  // tslint:disable-next-line:typedef
  protected buildData(length: number) {
    console.log(length);
    const ITEMS_RENDERED_AT_ONCE = 200;
    const INTERVAL_IN_MS = 50;

    console.log('buildData triggered');
    const nextIndex = this.currentIndex + ITEMS_RENDERED_AT_ONCE;
    let finished = false;

    for (let n = this.currentIndex; n <= nextIndex ; n++) {
      console.log(n);
      if (n >= length) {
        finished = true;
        break;
      }

      const context = {
        box: this.flatBoundingBoxes[n]
      };

      if (this.container && this.template) {
        this.container.createEmbeddedView(this.template, context);
      }
    }

    if (finished) {
      this.currentIndex = 0;
      console.log('buildData done!');
    } else {
      this.currentIndex += ITEMS_RENDERED_AT_ONCE;
      console.log('Batch ' + this.currentIndex / ITEMS_RENDERED_AT_ONCE + ' complete!');

      // call buildData again for next chunk after at least INTERVAL_IN_MS has passed
      setTimeout(() => { this.buildData(length); }, INTERVAL_IN_MS );
    }
  }

  public getBoundingBoxObservable(): Observable<any> {
    console.log('getBoundingBoxObservable');
    // of(this.flatBoundingBoxes).pipe(
    //   map(item => console.log(item))
    // );
    // return from(this.flatBoundingBoxes).pipe(
    //   this.lazyArray()
    // );
    return from([]);
  }

  public trackByMethod(index: number, item: any): number {
    return index;
  }

  // tslint:disable-next-line:typedef
  lazyArray = <T>(
    delayMs = 0,
    concurrency = 2,
    isFirstEmission = true
  ) => (source$: Observable<T[]>) =>
    source$.pipe(
      mergeMap(items =>
        !isFirstEmission
          ? of(items)
          : from(items).pipe(
              bufferCount(concurrency),
              concatMap((value, index) =>
                scheduled(of(value), animationFrameScheduler).pipe(
                  delay(index * delayMs)
                )
              ),
              scan((acc: T[], steps: T[]) => [...acc, ...steps], []),
              tap((scannedItems: T[]) =>
                scannedItems.length === items.length
                  ? (isFirstEmission = false)
                  : null
              )
            )
      )
    )

}
