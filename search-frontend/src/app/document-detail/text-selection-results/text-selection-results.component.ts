import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Globals } from 'src/app/globals';
import { SearchResult } from 'src/app/model/SearchResult';

@Component({
  selector: 'app-text-selection-results',
  templateUrl: './text-selection-results.component.html',
  styleUrls: ['./text-selection-results.component.scss']
})
export class TextSelectionResultsComponent implements OnInit {
  @Input() result?: SearchResult;
  @Input() selectedText?: string;
  @Output() languageSelected = new EventEmitter<string>();
  @Output() scrolled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('cards') cardsElement?: ElementRef;


  constructor(public globals: Globals) { }

  ngOnInit(): void {
  }

  hasHits(): boolean {
    if (this.result && this.result.hits) {
      return this.result.hits.length >= 0;
    }
    return false;
  }

  onLanguageFilter(languageCode: string): void {
    this.languageSelected.emit(languageCode);
    this.cardsElement?.nativeElement?.scrollTo(0, 0);
  }

  onScroll(): void {
    console.log('scroll!');
    this.scrolled.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
