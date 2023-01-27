import { Translation } from './Translation';

export interface Translations {
    languages: string[];
    sourceLanguage: string;
    translations: Translation[];
    flatTerms: string[];
    stems: any;
    stemMap: any;
    synonyms: any;
}
