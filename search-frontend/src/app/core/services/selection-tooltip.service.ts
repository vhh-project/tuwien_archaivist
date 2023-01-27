import { Injectable } from '@angular/core';
import { ModuleData } from '../models/ModuleData';

@Injectable({
  providedIn: 'root'
})
export class SelectionTooltipService {


  listener?: SelectionTooltipListener;
  previousLanguage = '';
  previousSelection = '';
  private previousModule?: ModuleData;

  constructor() { }

  addListener(listener: SelectionTooltipListener): void {
    this.listener = listener;
  }

  toggleTooltip(language: string = '', moduleData?: ModuleData): void {
    this.previousLanguage = language !== '' ? language : this.previousLanguage;
    this.previousModule = moduleData ? moduleData : this.previousModule;
    if (this.listener) {
      this.listener.toggleTooltip();
    }
  }

  clearTextSelection(full = false): void {
    if (full) {
      if (window.getSelection) {
        if (window.getSelection()?.empty) {  // Chrome
          window.getSelection()?.empty();
        } else if (window.getSelection()?.removeAllRanges) {  // Firefox
          window.getSelection()?.removeAllRanges();
        }
      }
    }
    document.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
  }

  getSelectedText(): string | undefined {
    if (window.getSelection) {
      const selection = window.getSelection()?.toString();
      if (selection && selection !== '') {
        this.previousSelection = selection;
      }
      return window.getSelection()?.toString();
    }
    return undefined;
  }

  getPreviousModule(consume = false): ModuleData | undefined {
    const module = this.previousModule;
    if (consume) {
      this.previousModule = undefined;
    }
    return module;
  }

  getSelectionModuleIndex(): number {
    let index = -1;
    if (window.getSelection) {
      const selection = window.getSelection();

      if (selection) {

        let elem = selection.anchorNode as HTMLElement;
        let isItem = elem.classList && elem.classList.contains('item');
        while (!isItem) {
          elem = elem.parentElement as HTMLElement;
          isItem = elem.classList && elem.classList.contains('item');
        }
        index = elem.id.split('-')[1] as unknown as number;
      }
    }
    return index;
  }

  getRelevantItemStem(): string | null {
    if (window.getSelection) {
      const selection = window.getSelection();

      if (selection) {

        let elem = selection.anchorNode as HTMLElement;
        let isRelevant = elem.classList && elem.classList.contains('relevant');
        let isSynonym = elem.classList && elem.classList.contains('synonym');

        while (!isRelevant && !isSynonym) {
          elem = elem.parentElement as HTMLElement;
          isRelevant = elem.classList && elem.classList.contains('relevant');
          isSynonym = elem.classList && elem.classList.contains('synonym');
        }

        if (isRelevant) {
          const stem = elem.getAttribute('stem');
          if (stem) {
            return stem;
          }
        } else if (isSynonym) {
          return selection.toString();
        }
      }
    }
    return null;
  }

  getPreviousModuleQueries(consume = false): string[] {
    if (this.previousModule) {
      const queries = this.previousModule.queries.slice();
      if (consume) {
        this.previousModule = undefined;
      }
      return queries;
    } else {
      return [];
    }
  }
}

export interface SelectionTooltipListener {
  toggleTooltip(): void;
}
