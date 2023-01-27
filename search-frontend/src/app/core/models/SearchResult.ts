import { QueryMetadata } from './QueryMetadata';
import { SearchResultItem } from './SearchResultItem';

export interface SearchResult {
    hits: SearchResultItem[];
    total: number;
    queryMetadata: QueryMetadata;
    boundingBoxes: any;
  }
