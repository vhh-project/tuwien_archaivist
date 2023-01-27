import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BoundedImageViewerComponent } from '../bounded-image-viewer/bounded-image-viewer.component';

@Component({
  selector: 'app-bounded-snippet-viewer',
  templateUrl: './bounded-snippet-viewer.component.html',
  styleUrls: ['./bounded-snippet-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BoundedSnippetViewerComponent extends BoundedImageViewerComponent implements AfterViewInit {
  @ViewChild('boundingContainer', { static: false }) boundingContainer?: ElementRef;

  @Input() snippetName?: string;
  @Input() snippetBox: any;

  protected initBoxContent(): void {
    const boxObservable =
    this.vespaService.buildBoundingBoxContent(this.language, this.boundingData, this.metaData, this.stemFilters, this.snippetBox);
    boxObservable.subscribe(
      boxResponse => {
        this.boundingBoxContent = boxResponse.content;
        this.resize = !this.resize;
      }
    );
  }

  ngAfterViewInit(): void {
    this.initDragSelection('.bounding-container', this.boundingContainer);
  }

  calcScales(): void{
    const snippetWidth = this.snippetBox[1] - this.snippetBox[0];
    const snippetHeight = this.snippetBox[3] - this.snippetBox[2];
    super.calcScales();
    if (this.imageHeight && this.imageWidth) {
      this.scaleWidth = this.imageWidth / snippetWidth;
      this.scaleHeight = this.imageHeight / snippetHeight;
    }
  }
}
