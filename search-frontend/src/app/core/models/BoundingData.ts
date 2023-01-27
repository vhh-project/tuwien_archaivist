export interface BoundingData {
    boxes: any;
    stems: any;
    dimensions: Dimensions;
    words: string[];
}

export interface Dimensions {
    scale: number;
    origWidth: number;
    origHeight: number;
}
