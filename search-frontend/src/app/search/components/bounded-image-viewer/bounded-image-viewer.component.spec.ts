import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoundedImageViewerComponent } from './bounded-image-viewer.component';

describe('BoundedImageViewerComponent', () => {
  let component: BoundedImageViewerComponent;
  let fixture: ComponentFixture<BoundedImageViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoundedImageViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoundedImageViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
