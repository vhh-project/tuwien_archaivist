import { Component, Input, OnInit } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { BoundedImageViewerComponent } from '../bounded-image-viewer/bounded-image-viewer.component';
import { VespaService } from '../service/vespa.service';

@Component({
  selector: 'app-bounded-snippet-viewer',
  templateUrl: './bounded-snippet-viewer.component.html',
  styleUrls: ['./bounded-snippet-viewer.component.scss']
})
export class BoundedSnippetViewerComponent extends BoundedImageViewerComponent implements OnInit {

  @Input() snippetName?: string;
  @Input() snippetBox: any;

  constructor(
    public vespaService: VespaService,
    public clipboardService: ClipboardService,
    public toastr: ToastrService) { super(vespaService, clipboardService, toastr); }

  ngOnInit(): void {
    super.ngOnInit();
    this.flatBoundingBoxes = this.filterSnippetTermBoxes();
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

  private filterSnippetTermBoxes(): Array<{ box: number[], word: string}> {
    // x1, x2, y1, y2
    const filteredBoxes: Array<{ box: number[], word: string}> = [];
    this.flatBoundingBoxes.forEach((data: { box: number[], word: string }) => {
      const box = data.box;
      if (box[0] >= this.snippetBox[0] &&
        box[1] <= this.snippetBox[1] &&
        box[2] >= this.snippetBox[2] &&
        box[3] <= this.snippetBox[3]) {
          const adjustedBox = [box[0], box[1], box[2] - this.snippetBox[2], box[3] - this.snippetBox[2]];
          filteredBoxes.push({box: adjustedBox, word: data.word});
      }
    });
    return filteredBoxes;
  }

}
