import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreamPreviewCardComponent } from './stream-preview-card.component';

describe('StreamCardComponent', () => {
  let component: StreamPreviewCardComponent;
  let fixture: ComponentFixture<StreamPreviewCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamPreviewCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StreamPreviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
