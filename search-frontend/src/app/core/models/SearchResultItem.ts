import { Document } from './Document';

export interface SearchResultItem {
    fields: Document;
    id?: string;
    relevance: number;
    source: string;
  }
