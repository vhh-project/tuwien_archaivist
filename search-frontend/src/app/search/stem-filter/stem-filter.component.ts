import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StemFilter } from 'src/app/core/models/StemFilter';

export interface RemoveFilterArgs {
  language: string;
  index: number;
}

@Component({
  selector: 'app-stem-filter',
  templateUrl: './stem-filter.component.html',
  styleUrls: ['./stem-filter.component.scss']
})
export class StemFilterComponent implements OnInit {
  @Input() stemFilters!: StemFilter[];
  @Input() language = '';
  @Output() filterRemoved = new EventEmitter<RemoveFilterArgs>();

  constructor() { }

  ngOnInit(): void {
  }

  removeStemFilter(language: string, index: number): void {
    this.filterRemoved.emit({language, index});
  }

}
