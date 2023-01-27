import { BoundingData } from './BoundingData';
import { SearchResultItem } from './SearchResultItem';

export interface PageResult {
    item: SearchResultItem;
    boundingData: BoundingData;
}
