import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appModuleItem]'
})
export class ModuleItemDirective implements OnInit{

  constructor(private el: ElementRef) {
  }

  ngOnInit(): void{
    this.el.nativeElement.scrollIntoView({ behavior: 'smooth', inline: 'center'});
  }
}
