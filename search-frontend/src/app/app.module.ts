import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {APP_BASE_HREF} from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Forms Module - for ngModel
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { AngularSplitModule } from 'angular-split';
import { ClipboardModule } from 'ngx-clipboard';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { InViewportModule } from '@thisissoon/angular-inviewport';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { SearchModule } from './search/search.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    CoreModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    InfiniteScrollModule,
    PdfViewerModule,
    AngularSplitModule,
    ClipboardModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    InViewportModule,
    ScrollingModule,
    SharedModule,
    SearchModule
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: '/archaivist'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
