import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoundedImageViewerComponent } from '../bounded-image-viewer/bounded-image-viewer.component';
import { DocumentModuleData } from '../model/ModuleData';
import { SearchResult } from '../model/SearchResult';
import { VespaService } from '../service/vespa.service';
import { Globals } from '../globals';

@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit {
  @Input() data?: DocumentModuleData;
  @Input() inViewport?: boolean;
  @Output() termsSelected = new EventEmitter<string>();

  @ViewChild('docImage', { static: false }) docImage?: ElementRef;

  @ViewChild(BoundedImageViewerComponent, { static: false }) private boundedImageViewerComponent?: BoundedImageViewerComponent;

  docName: any;
  docPage: any;
  page = 0;
  language = '';
  selectedText = '';
  boundingData: any;
  terms: any;

  constructor(public globals: Globals, private route: ActivatedRoute, public vespaService: VespaService) { }

  ngOnInit(): void {
    this.docName = this.data?.resultItem?.fields.parent_doc;
    this.docPage = this.data?.resultItem?.fields.page;

    this.boundingData = this.data?.result?.boundingBoxes[this.docName][this.docPage];
    this.terms = this.data?.result?.queryMetadata.translations.flatTerms;
  }

  onTextSelected(text: string): void {
    console.log('onTextSelected: ' + text);
    if (this.selectedText === text) {
      return;
    }

    this.selectedText = text;

    if (text === '') {
      return;
    }

    this.termsSelected.emit(text);
  }

  private clearTextSelection(): void {
    if (window.getSelection) {
      if (window.getSelection()?.empty) {  // Chrome
        window.getSelection()?.empty();
      } else if (window.getSelection()?.removeAllRanges) {  // Firefox
        window.getSelection()?.removeAllRanges();
      }
    }
  }
}
