import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appFitTextPlus]'
})
export class FitTextPlusDirective implements AfterViewInit, OnChanges {

  @Input() fittext ?= true;
  @Input() activateOnResize ?= true;
  @Input() delay = 100;
  @Input() innerHTML: any;
  @Input() fontUnit?: 'px' | 'em' | string = 'px';
  @Input() resize ?= false;

  private fontSizes: number[] = [];
  private fittextElement: HTMLElement;
  private resizeTimeout?: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.fittextElement = el.nativeElement;
  }

  @HostListener('window:resize')
  public onWindowResize = (): void => {
    if (this.activateOnResize) {
      this.setFontSize();
    }
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
    const elements: NodeListOf<HTMLElement> = this.fittextElement.querySelectorAll('.fittext-target');

    this.resizeTimeout = setTimeout(
      (() => {
        elements.forEach((element, i) => {
          if (element.offsetHeight * element.offsetWidth !== 0) {
            // set new
            this.fontSizes[i] = this.calculateNewFontSize(element);
          }
        });

        this.fontSizes.forEach((size, i) => {
          this.setStyles(elements[i], size);
        });
      }).bind(this),
      delay
    );
  }

  private calculateNewFontSize = (element: HTMLElement): number => {
    // tslint:disable-next-line:no-non-null-assertion
    const outerBox = element.parentElement!.getBoundingClientRect();
    const innerBox = element.getBoundingClientRect();
    const cs = window.getComputedStyle(element);
    const currentFontsize: number = cs.getPropertyValue('font-size').slice(0, -2) as unknown as number;
    const ratioW = outerBox.width / innerBox.width;
    const newFontsize = Math.round(currentFontsize * ratioW * 10) / 10;
    return newFontsize;
  }

  private setStyles = (element: HTMLElement, fontSize: number): void => {
    if (element) {
      this.renderer.setStyle(element, 'fontSize', fontSize.toString() + this.fontUnit);
    }
  }
}
