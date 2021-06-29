import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Globals } from '../globals';

@Component({
  selector: 'app-language-filter',
  templateUrl: './language-filter.component.html',
  styleUrls: ['./language-filter.component.scss']
})
export class LanguageFilterComponent implements OnInit {

  @Input() moduleLang?: string;
  @Input() hasHits?: boolean;
  @Output() languageSelected = new EventEmitter<string>();

  constructor(public globals: Globals) { }

  ngOnInit(): void {
  }

  selectLanguage(languageCode: string): void {
    this.languageSelected.emit(languageCode);
  }
}
