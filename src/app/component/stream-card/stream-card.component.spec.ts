import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreamCardComponent } from './stream-card.component';

describe('ThumbnailCardComponent', () => {
  let component: StreamCardComponent;
  let fixture: ComponentFixture<StreamCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StreamCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
