import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { FitTextPlusDirective } from './directives/fit-text-plus/fit-text-plus.directive';
import { ModuleItemDirective } from './directives/module-item/module-item.directive';
import { LanguageFilterComponent } from './components/language-filter/language-filter.component';


@NgModule({
  declarations: [
    SafeHtmlPipe,
    FitTextPlusDirective,
    ModuleItemDirective,
    LanguageFilterComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SafeHtmlPipe,
    FitTextPlusDirective,
    ModuleItemDirective,
    LanguageFilterComponent
  ]
})
export class SharedModule { }
