import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Globals } from 'src/app/core/constants/globals';


@Component({
  selector: 'app-language-filter',
  templateUrl: './language-filter.component.html',
  styleUrls: ['./language-filter.component.scss']
})
export class LanguageFilterComponent implements OnInit {

  @Input() language?: string;
  @Output() languageSelected = new EventEmitter<string>();

  constructor(public globals: Globals) { }

  ngOnInit(): void {
  }

  onChange(event: Event): void {
    if (event.target) {
      const target = event.target as HTMLOptionElement;
      this.languageSelected.emit(target.value);
    }
  }
}
