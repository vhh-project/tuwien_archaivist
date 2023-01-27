import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoModalContentComponent } from './info-modal-content.component';

describe('InfoModalContentComponent', () => {
  let component: InfoModalContentComponent;
  let fixture: ComponentFixture<InfoModalContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfoModalContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoModalContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
