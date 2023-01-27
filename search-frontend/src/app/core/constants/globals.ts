// globals.ts
import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class Globals {
    supportedLanguages = ['en', 'de', 'fr', 'ca', 'it', 'es', 'ru', 'pl', 'bn', 'da'];
    countryCodes = ['gb', 'de', 'fr', 'ad', 'it', 'es', 'ru', 'pl', 'bd', 'dk'];
    languageNames = ['English', 'German', 'French', 'Catalan', 'Italian', 'Spanish', 'Russian', 'Polish', 'Bengali', 'Danish'];
    unknownLanguage = 'un';

    languageToCountry(language: any): string {
        return this.countryCodes[this.supportedLanguages.indexOf(language)];
    }

    languageCodeToName(languageCode: any): string {
        if (languageCode === '') {
            return 'All languages';
        }
        return this.languageNames[this.supportedLanguages.indexOf(languageCode)];
    }
}
