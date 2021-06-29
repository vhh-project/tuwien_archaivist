import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextSelectionResultsComponent } from './text-selection-results.component';

describe('TextSelectionResultsComponent', () => {
  let component: TextSelectionResultsComponent;
  let fixture: ComponentFixture<TextSelectionResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextSelectionResultsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextSelectionResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
