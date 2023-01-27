import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoundedSnippetViewerComponent } from './bounded-snippet-viewer.component';

describe('BoundedSnippetViewerComponent', () => {
  let component: BoundedSnippetViewerComponent;
  let fixture: ComponentFixture<BoundedSnippetViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoundedSnippetViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoundedSnippetViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
