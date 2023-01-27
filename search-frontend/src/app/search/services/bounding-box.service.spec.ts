import { TestBed } from '@angular/core/testing';

import { BoundingBoxService } from './bounding-box.service';

describe('BoundingBoxService', () => {
  let service: BoundingBoxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoundingBoxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
