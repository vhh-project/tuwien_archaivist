import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { DocumentDetailComponent } from './components/document-detail/document-detail.component';
import { BoundedSnippetViewerComponent } from './components/bounded-snippet-viewer/bounded-snippet-viewer.component';
import { InfoModalContentComponent } from './components/info-modal-content/info-modal-content.component';
import { BoundedImageViewerComponent } from './components/bounded-image-viewer/bounded-image-viewer.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { SharedModule } from '../shared/shared.module';
import { AngularResizedEventModule } from 'angular-resize-event';
import { InViewportModule } from '@thisissoon/angular-inviewport';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { StemFilterComponent } from './stem-filter/stem-filter.component';



@NgModule({
  declarations: [
    SearchResultsComponent,
    DocumentDetailComponent,
    BoundedImageViewerComponent,
    BoundedSnippetViewerComponent,
    InfoModalContentComponent,
    StemFilterComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    VirtualScrollerModule,
    SharedModule,
    InViewportModule,
    AngularResizedEventModule,
    InViewportModule,
    ScrollingModule,
  ],
  exports: [
    SearchResultsComponent,
    DocumentDetailComponent,
    InfoModalContentComponent,
    StemFilterComponent
  ]
})
export class SearchModule { }
