import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appModuleItem]'
})
export class ModuleItemDirective implements OnInit{

  @Input() inViewport!: boolean;
  private first = true;

  constructor(private el: ElementRef) {
  }

  ngOnInit(): void {
    this.scrollToItem();
  }

  private scrollToItem(): void {
    // console.log(`${this.el.nativeElement.id} | viewport: ${this.inViewport} first:${this.first}`);
    if (this.inViewport) {
      this.first = false;
    } else if (this.first) {
      this.el.nativeElement?.scrollIntoView({ behavior: 'smooth', inline: 'center'});
      setTimeout(() => this.scrollToItem(), 100);
    }
  }
}
