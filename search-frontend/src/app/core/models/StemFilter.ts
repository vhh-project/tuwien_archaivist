export class StemFilter {
    private language: string;
    private stems: string[];

    constructor(language: string, stems: string[]) {
        this.language = language;
        this.stems = stems;
    }

    addStem(stem: string): void {
        this.stems.push(stem);
    }

    getLanguage(): string {
        return this.language;
    }

    getStems(): string [] {
        return this.stems;
    }
 }
