import {Component, Input} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {ChannelService, StreamService, VideoService, LoadingIndicatorComponent, LoadingService, SessionService} from '@shigde/core';
import {provideRouter} from '@angular/router';
import {BehaviorSubject, of, Subject} from 'rxjs';
import {AlertService} from '../../../../providers/alert.service';
import {StreamPreviewCardComponent} from '../../../../component/stream-preview-card/stream-preview-card.component';
import {ChannelComponent} from './channel.component';

@Component({selector: 'app-stream-preview-card', template: '{{stream.title}}'})
class PreviewStub { @Input() stream: any; @Input() replayStatus: any; }

describe('Channel asynchronous loading', () => {
  let user: BehaviorSubject<any>;
  let channelResponse: Subject<any>;
  let streamsResponse: Subject<any>;
  let replaysResponse: Subject<any>;
  beforeEach(async () => {
    user = new BehaviorSubject(null);
    channelResponse = new Subject();
    streamsResponse = new Subject();
    replaysResponse = new Subject();
    await TestBed.configureTestingModule({imports: [ChannelComponent, LoadingIndicatorComponent], providers: [
      provideRouter([]),
      {provide: SessionService, useValue: {getUser: () => user}},
      {provide: ActivatedRoute, useValue: {snapshot: {params: {channelUuid: 'channel'}}}},
      {provide: Router, useValue: {}},
      {provide: AlertService, useValue: {alert: () => {}}},
      {provide: ChannelService, useValue: {fetch: () => channelResponse}},
      {provide: StreamService, useValue: {getChannelStreamPreviewList: () => streamsResponse}},
      {provide: VideoService, useValue: {getChannelPreviewList: () => replaysResponse, list: () => of([])}},
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
    channelResponse.next({data: {user: 'owner@example.test', name: 'original@example.test', display_name: 'My channel', uuid: 'stable-channel-id', banner_name: 'banner.png', description: 'Description'}});
    loading.loadingOff();
    streamsResponse.next({data: [{uuid: 'stream', title: 'Loaded stream'}]});
    loading.loadingOff();
    await fixture.whenStable();
    await loader.whenStable();
    expect(loader.nativeElement.querySelector('.spinner-container')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe('My channel');
    expect(fixture.nativeElement.querySelector('.channel-banner img')?.getAttribute('src')).toContain('/static/banner.png');
    expect(fixture.nativeElement.textContent).toContain('Loaded stream');
    expect(fixture.nativeElement.textContent).toContain('original@example.test');
    expect(fixture.nativeElement.querySelector('.channel-owner')?.textContent).toContain('User: owner@example.test');
    expect(fixture.nativeElement.textContent).not.toContain('stable-channel-id');
    fixture.destroy();
    loader.destroy();
  });
  it('shows private tabs only for the channel owner and resets them on logout', async () => {
    const fixture = TestBed.createComponent(ChannelComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const tabs = () => Array.from(fixture.nativeElement.querySelectorAll('[ngbNavLink]') as NodeListOf<HTMLElement>).map(el => el.textContent?.trim());
    expect(tabs()).toEqual(['Overview', 'Streams', 'Replays']);
    user.next({channel_uuid: 'another-channel'});
    await fixture.whenStable();
    expect(tabs()).toEqual(['Overview', 'Streams', 'Replays']);
    user.next({channel_uuid: 'channel'});
    await fixture.whenStable();
    expect(tabs()).toEqual(['Overview', 'Streams', 'Replays', 'Dashboard', 'Lobby']);
    (fixture.nativeElement.querySelectorAll('[ngbNavLink]')[3] as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Stream overview');
    user.next(null);
    await fixture.whenStable();
    expect(tabs()).toEqual(['Overview', 'Streams', 'Replays']);
    expect(fixture.componentInstance.activeTab).toBe('overview');
    expect(fixture.nativeElement.textContent).not.toContain('Stream overview');
    fixture.destroy();
  });

  it('separates streams and replays in Overview and the public tabs', async () => {
    const fixture = TestBed.createComponent(ChannelComponent);
    fixture.autoDetectChanges();
    streamsResponse.next({data: [{uuid: 'live', title: 'Live title'}, {uuid: 'replay', type: 'video', title: 'Replay title'}]});
    replaysResponse.next([{uuid: 'replay', type: 'video', title: 'Replay title'}]);
    await fixture.whenStable();
    expect(fixture.componentInstance.streams.length).toBe(1);
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('#channel-streams-title')).not.toBeNull();
    expect(root.querySelector('#channel-replays-title')?.textContent).toBe('Replays');
    expect(root.textContent).toContain('Live title');
    expect(root.textContent).toContain('Replay title');
    fixture.componentInstance.activeTab = 'replays';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('#channel-streams-title')).toBeNull();
    expect(root.textContent).toContain('Replay title');
    expect(root.querySelector('.channel-owner-row button')).toBeNull();
    fixture.destroy();
  });

});
