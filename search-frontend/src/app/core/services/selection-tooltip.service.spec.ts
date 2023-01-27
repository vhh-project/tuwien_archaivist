import { TestBed } from '@angular/core/testing';

import { SelectionTooltipService } from './selection-tooltip.service';

describe('SelectionTooltipService', () => {
  let service: SelectionTooltipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectionTooltipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
