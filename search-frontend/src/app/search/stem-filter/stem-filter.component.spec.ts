import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StemFilterComponent } from './stem-filter.component';

describe('StemFilterComponent', () => {
  let component: StemFilterComponent;
  let fixture: ComponentFixture<StemFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StemFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StemFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
