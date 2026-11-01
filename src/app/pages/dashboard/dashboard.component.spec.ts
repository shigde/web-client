import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {StreamPreview, StreamService, VideoService} from '@shigde/core';
import {of, throwError} from 'rxjs';
import {AlertService} from '../../providers/alert.service';
import { DashboardComponent } from './dashboard.component';

describe('Dashboard content sections', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  const live = {uuid: 'live', type: 'stream'} as StreamPreview;
  const video = {uuid: 'recorded', type: 'video'} as StreamPreview;
  let videos: jasmine.SpyObj<VideoService>;

  beforeEach(async () => {
    videos = jasmine.createSpyObj('VideoService', ['getPreviewList']);
    videos.getPreviewList.and.returnValue(of([{...video, startTime: null, endTime: null}] as any));
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: StreamService, useValue: {getStreamPreviewList: () => of({data: [live, video]})}},
        {provide: VideoService, useValue: videos},
        {provide: AlertService, useValue: {alert: jasmine.createSpy('alert')}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
  });

  it('separates livestreams from videos without duplicating mixed previews', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.streams).toEqual([live]);
    expect(fixture.componentInstance.videos[0].uuid).toBe('recorded');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('#streams-heading')?.textContent).toContain('Livestreams');
    expect(root.querySelector('#past-videos-heading')?.textContent).toContain('Replays');
    expect(root.querySelectorAll('section')[0].querySelectorAll('app-stream-preview-card').length).toBe(1);
    expect(root.querySelectorAll('section')[1].querySelectorAll('app-stream-preview-card').length).toBe(1);
  });

  it('keeps livestreams available when the video list fails', () => {
    videos.getPreviewList.and.returnValue(throwError(() => new Error('offline')));
    fixture.detectChanges();
    expect(fixture.componentInstance.streams).toEqual([live]);
    expect(fixture.componentInstance.videosLoaded).toBeTrue();
    expect(fixture.componentInstance.videos).toEqual([]);
  });
});
