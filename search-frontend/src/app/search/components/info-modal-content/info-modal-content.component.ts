import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Globals } from 'src/app/core/constants/globals';
import { getLanguageName } from 'language-name-to-language-name';
import { ModuleData } from 'src/app/core/models/ModuleData';
import { Translations } from 'src/app/core/models/Translations';



@Component({
  selector: 'app-info-modal-content',
  templateUrl: './info-modal-content.component.html',
  styleUrls: ['./info-modal-content.component.scss']
})
export class InfoModalContentComponent implements OnInit {
  @Input() data!: ModuleData;

  translations!: Translations[];
  stemMap: any = {};
  translationMap: any = {};
  Object = Object; // Make the Object function available to the template

  constructor(
    public activeModal: NgbActiveModal,
    public globals: Globals
  ) {}

  ngOnInit(): void {
    // TODO figure out how to visualize multipe queries
    this.translations = this.data.result.queryMetadata.translations;
    this.translations.forEach(phraseTranlations => {
      Object.assign(this.stemMap, phraseTranlations.stemMap);
      phraseTranlations.translations.forEach(translation => {
        if (translation.languageCode !== this.globals.unknownLanguage) {
          if (translation.languageCode in this.translationMap) {
            this.translationMap[translation.languageCode].push(...translation.content);
          } else {
            this.translationMap[translation.languageCode] = [...translation.content];
          }
        }
      });
    });
  }

  getDetectedLanguage(index: number): string {
    if (this.translations[index].sourceLanguage === this.globals.unknownLanguage) {
      return 'Unknown (defaults to English)';
    }

    return getLanguageName(this.translations[index].sourceLanguage);
  }

  getLang(languageCode: string): string {
    return getLanguageName(languageCode);
  }

  getFilteredTranslations(index: number): any {
    return this.translations[index].translations.filter(item => item.languageCode !== this.globals.unknownLanguage);
  }

  hasSynonyms(): boolean {
    return this.translations.reduce((sum, phraseTranslations) => sum + phraseTranslations.synonyms.length, 0) > 0;
  }

  toggleSynonymPop(pop: NgbPopover, synonym: any): void {
    if (pop.isOpen()) {
      pop.close();
    } else {
      pop.open({synonym});
    }
  }
}
