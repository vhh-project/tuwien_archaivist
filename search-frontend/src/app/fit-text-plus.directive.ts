import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appFitTextPlus]'
})
export class FitTextPlusDirective implements AfterViewInit, OnInit, OnChanges {

  @Input() fittext ?= true;
  @Input() compression ?= 1;
  @Input() activateOnResize ?= true;
  @Input() minFontSize?: number | 'inherit' = 0;
  @Input() maxFontSize?: number | 'inherit' = Number.POSITIVE_INFINITY;
  @Input() delay = 100;
  @Input() innerHTML: any;
  @Input() fontUnit?: 'px' | 'em' | string = 'px';
  @Input() resize ?= false;

  private fittextParent: HTMLElement | null;
  private fittextElement: HTMLElement;
  private fittextMinFontSize?: any;
  private fittextMaxFontSize?: any;
  private computed: CSSStyleDeclaration;
  private newlines: number;
  private lineHeight: string;
  private display: string;
  private calcSize = 10;
  private resizeTimeout?: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.fittextElement = el.nativeElement;
    this.fittextParent = this.fittextElement.parentElement;
    this.computed = window.getComputedStyle(this.fittextElement);
    this.newlines = this.fittextElement.childElementCount > 0 ? this.fittextElement.childElementCount : 1;
    this.lineHeight = this.computed.lineHeight;
    this.display = this.computed.display;
  }

  @HostListener('window:resize')
  public onWindowResize = (): void => {
    if (this.activateOnResize) {
      this.setFontSize();
    }
  }

  public ngOnInit(): void {
    this.fittextMinFontSize = this.minFontSize === 'inherit' ? this.computed.fontSize : this.minFontSize;
    this.fittextMaxFontSize = this.maxFontSize === 'inherit' ? this.computed.fontSize : this.maxFontSize;
  }

  public ngAfterViewInit(): void {
    this.setFontSize(0);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.compression && !changes.compression.firstChange) {
      this.setFontSize(0);
    }
    if (changes.innerHTML) {
      this.fittextElement.innerHTML = this.innerHTML;
      if (!changes.innerHTML.firstChange) {
        this.setFontSize(0);
      }
    }
    if (changes.resize && this.activateOnResize) {
      this.setFontSize();
    }
  }

  private setFontSize = (delay: number = this.delay): void => {
    this.resizeTimeout = setTimeout(
      (() => {
        if (this.fittextElement.offsetHeight * this.fittextElement.offsetWidth !== 0) {
          // reset to default
          this.setStyles(this.calcSize, 1, 'inline-block');
          // set new
          this.setStyles(this.calculateNewFontSize(), this.lineHeight, this.display);
        }
      }).bind(this),
      delay
    );
  }

  private calculateNewFontSize = (): number => {
    const ratio = (this.calcSize * this.newlines) / this.fittextElement.offsetWidth / this.newlines;

    return Math.max(
      Math.min(
        // tslint:disable-next-line:no-non-null-assertion
        (this.fittextParent!.offsetWidth -
          // tslint:disable-next-line:no-non-null-assertion
          (parseFloat(getComputedStyle(this.fittextParent!).paddingLeft) +
            // tslint:disable-next-line:no-non-null-assertion
            parseFloat(getComputedStyle(this.fittextParent!).paddingRight)) -
          6) *
        ratio *
        // tslint:disable-next-line:no-non-null-assertion
        this.compression!,
        this.fittextMaxFontSize
      ),
      this.fittextMinFontSize
    );
  }

  private setStyles = (fontSize: number, lineHeight: number | string, display: string): void => {
    this.renderer.setStyle(this.fittextElement, 'fontSize', fontSize.toString() + this.fontUnit);
    this.renderer.setStyle(this.fittextElement, 'lineHeight', lineHeight.toString());
    this.renderer.setStyle(this.fittextElement, 'display', display);
  }
}
