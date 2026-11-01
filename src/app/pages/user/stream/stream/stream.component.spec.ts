import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {ChannelService, MediaService, RelayService, SessionService, StreamFriendService, StreamService, UserService, VideoService} from '@shigde/core';
import {AlertService} from '../../../../providers/alert.service';
import {RuntimeConfigService} from '../../../../providers/runtime-config.service';
import {StreamComponent} from './stream.component';

describe('Stream action bar', () => {
  let fixture: ComponentFixture<StreamComponent>;
  let component: StreamComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamComponent],
      providers: [
        {provide: ActivatedRoute, useValue: {snapshot: {params: {}}}},
        {provide: Router, useValue: {navigate: jasmine.createSpy('navigate')}},
        {provide: RuntimeConfigService, useValue: {relayService: 'https://example.test'}},
        ...[ChannelService, MediaService, StreamService, RelayService, SessionService, StreamFriendService, UserService, VideoService, AlertService]
          .map(provide => ({provide, useValue: {}}))
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(StreamComponent);
    component = fixture.componentInstance;
    component.hasStream = true;
    component.thumbnail = 'assets/images/default-banner-2.jpg';
    component.userName = 'Host';
    component.stream = {title: 'Test Stream', date: new Date(2026, 9, 25, 18, 30), channelUuid: 'channel', channelName: 'channel@example.test', channelDisplayName: 'My Channel', likes: 24, dislikes: 2, viewer: 128} as any;
  });

  it('shows metadata and statistics below the player for viewers without management controls', () => {
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const bar = root.querySelector('.stream-info-bar')!;
    expect(bar.textContent).toContain('Test Stream');
    expect(bar.querySelector('.stream-channel')?.textContent).toContain('My Channel');
    expect(root.querySelector('app-stream-countdown time')).not.toBeNull();
    expect(root.querySelector('.stream-media-meta')).toBeNull();
    expect(bar.querySelectorAll('.stream-reactions .stream-stat').length).toBe(2);
    expect(root.querySelector('.stream-chat')?.textContent).toContain('Chat opens when the stream starts.');
    expect(root.querySelector<HTMLInputElement>('.stream-chat input')?.disabled).toBeTrue();
    expect(root.querySelector<HTMLButtonElement>('.stream-chat button')?.disabled).toBeTrue();
    expect(root.querySelector('.stream-enter')).toBeNull();
    expect(root.querySelector('.stream-management')).toBeNull();
    expect(root.querySelector('.card-footer .bi-eye-fill')).toBeNull();
  });

  it('lets guests enter without offering owner actions', () => {
    component.isGuest = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stream-enter')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.stream-management')).toBeNull();
  });

  it('groups edit and delete in the owner menu and retains delete confirmation', () => {
    component.isOwner = true;
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.stream-enter')).not.toBeNull();
    expect(root.querySelector('.stream-management .dropdown-menu')?.textContent).toContain('Edit');
    expect(root.querySelector('.stream-management [data-bs-target="#deleteStreamModal"]')).not.toBeNull();
    expect(root.querySelector('#deleteStreamModal')).not.toBeNull();
  });

  it('uses HLS for videos without live, lobby or chat controls', () => {
    component.stream = {...component.stream, type: 'video'};
    component.streamUuid = 'recorded-video';
    component.isOwner = true;
    component.isGuest = true;
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(component.videoPlaybackUrl).toBe('/static/recordings/recorded-video/master.m3u8');
    expect(root.querySelector('app-hls-player video')?.hasAttribute('controls')).toBeTrue();
    expect(root.querySelector('moq-watch')).toBeNull();
    expect(root.querySelector('.stream-enter')).toBeNull();
    expect(root.querySelector('.stream-management')).toBeNull();
    expect(root.querySelector('.stream-chat')).toBeNull();
    expect(root.querySelector('app-stream-countdown')).toBeNull();
    expect(root.querySelector('.col-lg-12')).not.toBeNull();
  });
});
