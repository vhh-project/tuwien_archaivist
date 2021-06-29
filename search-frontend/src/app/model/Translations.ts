import { Translation } from './Translation';

export interface Translations {
    languages: string[];
    translations: Translation[];
    flatTerms: string[];
    stems: string[];
}
