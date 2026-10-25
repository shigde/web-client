import {Component, Input} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {ChannelService, StreamService, LoadingIndicatorComponent, LoadingService} from '@shigde/core';
import {provideRouter} from '@angular/router';
import {Subject} from 'rxjs';
import {AlertService} from '../../../../providers/alert.service';
import {StreamPreviewCardComponent} from '../../../../component/stream-preview-card/stream-preview-card.component';
import {ChannelComponent} from './channel.component';

@Component({selector: 'app-stream-preview-card', template: '{{stream.title}}'})
class PreviewStub { @Input() stream: any; }

describe('Channel asynchronous loading', () => {
  let channelResponse: Subject<any>;
  let streamsResponse: Subject<any>;
  beforeEach(async () => {
    channelResponse = new Subject();
    streamsResponse = new Subject();
    await TestBed.configureTestingModule({imports: [ChannelComponent, LoadingIndicatorComponent], providers: [
      provideRouter([]),
      {provide: ActivatedRoute, useValue: {snapshot: {params: {channelUuid: 'channel'}}}},
      {provide: Router, useValue: {}},
      {provide: AlertService, useValue: {alert: () => {}}},
      {provide: ChannelService, useValue: {fetch: () => channelResponse}},
      {provide: StreamService, useValue: {getChannelStreamPreviewList: () => streamsResponse}},
    ]}).overrideComponent(ChannelComponent, {remove: {imports: [StreamPreviewCardComponent]}, add: {imports: [PreviewStub]}}).compileComponents();
  });

  it('renders channel, banner and streams after responses without a poll or user event', async () => {
    const loader = TestBed.createComponent(LoadingIndicatorComponent);
    loader.autoDetectChanges();
    const loading = TestBed.inject(LoadingService);
    loading.loadingOn();
    loading.loadingOn();
    await loader.whenStable();
    expect(loader.nativeElement.querySelector('.spinner-container')).not.toBeNull();
    const fixture = TestBed.createComponent(ChannelComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    channelResponse.next({data: {name: 'Example', banner_name: 'banner.png', description: 'Description'}});
    loading.loadingOff();
    streamsResponse.next({data: [{uuid: 'stream', title: 'Loaded stream'}]});
    loading.loadingOff();
    await fixture.whenStable();
    await loader.whenStable();
    expect(loader.nativeElement.querySelector('.spinner-container')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe('Example');
    expect(fixture.nativeElement.querySelector('.channel-banner img')?.getAttribute('src')).toContain('/static/banner.png');
    expect(fixture.nativeElement.textContent).toContain('Loaded stream');
    fixture.destroy();
    loader.destroy();
  });
});
