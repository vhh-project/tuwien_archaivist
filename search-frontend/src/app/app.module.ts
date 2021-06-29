import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Forms Module - for ngModel
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SearchResultsComponent } from './search-results/search-results.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SafeHtmlPipe } from './safe-html.pipe';
import { Globals } from './globals';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { DocumentDetailComponent } from './document-detail/document-detail.component';
import { LanguageFilterComponent } from './language-filter/language-filter.component';
import { TextSelectionResultsComponent } from './document-detail/text-selection-results/text-selection-results.component';
import { AngularSplitModule } from 'angular-split';
import { BoundedImageViewerComponent } from './bounded-image-viewer/bounded-image-viewer.component';
import { AngularResizedEventModule } from 'angular-resize-event';
import { BoundedSnippetViewerComponent } from './bounded-snippet-viewer/bounded-snippet-viewer.component';
import { ClipboardModule } from 'ngx-clipboard';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { ModuleItemDirective } from './module-item.directive';
import { InViewportModule } from '@thisissoon/angular-inviewport';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {ScrollingModule as ExperimentalScrollingModule} from '@angular/cdk-experimental/scrolling';
import { FitTextPlusDirective } from './fit-text-plus.directive';

@NgModule({
  declarations: [
    AppComponent,
    SearchResultsComponent,
    SafeHtmlPipe,
    DocumentDetailComponent,
    LanguageFilterComponent,
    TextSelectionResultsComponent,
    BoundedImageViewerComponent,
    BoundedSnippetViewerComponent,
    ModuleItemDirective,
    FitTextPlusDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    InfiniteScrollModule,
    PdfViewerModule,
    AngularSplitModule,
    AngularResizedEventModule,
    ClipboardModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    InViewportModule,
    ScrollingModule,
    ExperimentalScrollingModule
  ],
  providers: [ Globals ],
  bootstrap: [AppComponent]
})
export class AppModule { }
