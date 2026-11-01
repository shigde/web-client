import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {RelayService} from '@shigde/core';
import {of} from 'rxjs';
import {AvatarComponent} from '../avatar/avatar.component';
import {StreamPreviewCardComponent} from './stream-preview-card.component';

describe('Stream preview channel identity', () => {
  it('does not offer playback or a zero duration for a failed replay', async () => {
    await TestBed.configureTestingModule({imports: [StreamPreviewCardComponent], providers: [
      {provide: RelayService, useValue: {pollHasAnnouncement: jasmine.createSpy('poll')}},
    ]}).compileComponents();
    const fixture = TestBed.createComponent(StreamPreviewCardComponent);
    fixture.componentRef.setInput('stream', {uuid: 'replay', type: 'video', durationMs: 0,
      channelUuid: 'channel', ownerName: 'Owner', channelName: 'Channel', title: 'Replay', thumbnail: ''});
    fixture.componentRef.setInput('replayStatus', 'failed');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stream-media-meta')).toBeNull();
    expect(fixture.nativeElement.querySelector('.bi-play-circle')).toBeNull();
    fixture.componentRef.setInput('replayStatus', 'ready');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bi-play-circle')).not.toBeNull();
    fixture.destroy();
  });
  it('shows the channel display name while keeping the owner avatar', async () => {
    await TestBed.configureTestingModule({imports: [StreamPreviewCardComponent], providers: [
      {provide: RelayService, useValue: {pollHasAnnouncement: () => of(false)}},
    ]}).compileComponents();
    const fixture = TestBed.createComponent(StreamPreviewCardComponent);
    const stream = {uuid: 'stream', channelUuid: 'channel', ownerName: 'Owner', channelName: 'channel@example.test', channelDisplayName: 'My Channel', title: 'Test', thumbnail: '', date: new Date(2026, 9, 25, 18, 30)};
    fixture.componentRef.setInput('stream', stream);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.data-row-caption').textContent).toContain('My Channel');
    expect(fixture.nativeElement.querySelector('.stream-media-meta').textContent).toContain('25.10. · 18:30');
    fixture.componentInstance.isLive = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stream-media-meta time')).toBeNull();
    expect(fixture.nativeElement.querySelector('.stream-media-meta').textContent).toContain('viewers');
    expect(fixture.debugElement.query(By.directive(AvatarComponent)).componentInstance.name).toBe('Owner');
    fixture.componentRef.setInput('stream', {...stream, channelDisplayName: ''});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.data-row-caption').textContent).toContain('channel@example.test');
    fixture.destroy();
  });
});
