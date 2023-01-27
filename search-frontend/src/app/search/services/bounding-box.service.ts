import { Injectable } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { Document } from '../../core/models/Document';

@Injectable({
  providedIn: 'root'
})
export class BoundingBoxService {

  constructor(
    private clipboardService: ClipboardService,
    private  toastr: ToastrService) { }

  public filterSnippetTermBoxes(boundingBoxes: Array<{ box: number[], word: string}>, snippetBox: any)
  : Array<{ box: number[], word: string}> {
    // x1, x2, y1, y2
    const filteredBoxes: Array<{ box: number[], word: string}> = [];
    boundingBoxes.forEach((data: { box: number[], word: string }) => {
      const box = data.box;
      if (box[0] >= snippetBox[0] &&
        box[1] <= snippetBox[1] &&
        box[2] >= snippetBox[2] &&
        box[3] <= snippetBox[3]) {
          const adjustedBox = [box[0], box[1], box[2] - snippetBox[2], box[3] - snippetBox[2]];
          filteredBoxes.push({box: adjustedBox, word: data.word});
      }
    });
    return filteredBoxes;
  }

  public flattenBoundingBoxes(boxes: any): any {
    const flatBoxes = [];
    const keys = Object.keys(boxes);
    // tslint:disable-next-line:forin
    for (const key in keys) {
      const word = keys[key];
      const wordBoxes = boxes[word];
      // tslint:disable-next-line:forin
      for (const boxKey in wordBoxes) {
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

  public copySnippetsText(document: Document, boundingBoxes: any, snippetBoxes: []): any {
    const body = this.summarizeSnippetsText(boundingBoxes, snippetBoxes);
    const footer = '\nfrom ' + document.parent_doc + ' | Page ' + document.page + ' powered by ArchAIvist';
    this.clipboardService.copy(body + footer);
    this.toastr.success('Snippets copied to clipboard!');
  }

  private summarizeSnippetsText(boundingBoxes: any, snippetBoxes: []): string {
    let summary = '';
    const flatBoundingBoxes = this.flattenBoundingBoxes(boundingBoxes);
    snippetBoxes.forEach((box, index) => {
      const filteredBoxes = this.filterSnippetTermBoxes(flatBoundingBoxes, box);
      summary += `Snippet #${index + 1}\n`;
      summary += '----------------\n';
      filteredBoxes.forEach(filteredBox => summary += filteredBox.word + ' ');
      summary += '\n----------------\n\n';
    });
    return summary;
  }
}

