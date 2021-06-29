import { ɵMetadataOverrider } from '@angular/core/testing';
import { single } from 'rxjs/operators';
import { QueryMetadata } from './QueryMetadata';
import { SearchResultItem } from './SearchResultItem';

export interface SearchResult {
    hits: SearchResultItem[];
    total: number;
    queryMetadata: QueryMetadata;
    boundingBoxes: any;
  }
