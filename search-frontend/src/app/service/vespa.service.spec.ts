import { TestBed } from '@angular/core/testing';

import { VespaService } from './vespa.service';

describe('VespaService', () => {
  let service: VespaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VespaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
