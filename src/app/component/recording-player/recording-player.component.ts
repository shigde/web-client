import '@moq/watch/element';
import '@moq/watch/ui';
import type MoqWatch from '@moq/watch/element';
import {ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {MediaPlayback, MediaService, SessionService} from '@shigde/core';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-recording-player', standalone: true, schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (error) { <p role="alert" class="p-3 text-danger">{{ error }}</p> }
    @if (playback) {
      <moq-watch-ui>
        <moq-watch #replayPlayer [attr.url]="url" [attr.name]="name" latency="350">
          <canvas></canvas>
        </moq-watch>
      </moq-watch-ui>
    }
    <button type="button" class="btn btn-primary m-3" [disabled]="loading" (click)="play()">
      {{ loading ? 'Loading recording…' : playback ? 'Play again from beginning' : 'Watch recording' }}
    </button>
  `,
  styles: [`:host { display:block; width:100%; background:#000; } moq-watch { display:block; aspect-ratio:16/9; } canvas { display:block; width:100%; height:100%; }`],
})
export class RecordingPlayerComponent implements OnDestroy {
  @Input({required: true}) streamUuid = '';
  @Input({required: true}) channelUuid = '';
  @Input({required: true}) relayUrl = '';
  playback?: MediaPlayback;
  url = '';
  name = '';
  error = '';
  loading = false;
  private subscriptions = new Subscription();
  private started = false;
  private destroyed = false;
  @ViewChild('replayPlayer') set player(ref: ElementRef<MoqWatch> | undefined) {
    if (!ref || !this.playback) return;
    const player = ref.nativeElement;
    // The relay connection is real before playback starts. An arbitrary timer
    // would lose the beginning on slow connections.
    player.signals.run(effect => {
      if (!effect.get(player.broadcast.active) || this.started || !this.playback) return;
      this.started = true;
      this.subscriptions.add(this.media.startPlayback(this.streamUuid, this.playback.id).subscribe({
        next: () => { this.loading = false; this.cdr.markForCheck(); },
        error: () => this.fail('Could not start recording playback.'),
      }));
    });
  }
  constructor(private media: MediaService, private session: SessionService, private cdr: ChangeDetectorRef) {}
  play(): void {
    if (this.loading) return;
    this.release();
    this.playback = undefined;
    this.cdr.detectChanges();
    this.loading = true; this.error = ''; this.started = false;
    this.subscriptions.add(this.media.createPlayback(this.streamUuid).subscribe({
      next: playback => {
        if (this.destroyed) return;
        this.playback = playback;
        // A fresh, scoped relay connection receives an exact grant for this
        // newly created playback, even if a pooled live connection exists.
        const slash = playback.name.lastIndexOf('/');
        const url = new URL(`${this.relayUrl.replace(/\/$/, '')}/${this.channelUuid}/${playback.name.slice(0, slash)}`);
        const token = this.session.getAuthenticationToken();
        if (token) url.searchParams.set('jwt', token);
        // Distinguish pooled connections while keeping a normal, nonempty
        // broadcast name relative to this recording's relay root.
        url.searchParams.set('playback', playback.name.slice(slash + 1));
        this.url = url.toString();
        this.name = playback.name.slice(slash + 1);
        this.cdr.detectChanges();
      },
      error: () => this.fail('Recording is unavailable or has been unpublished.'),
    }));
  }
  private fail(message: string): void { this.error = message; this.loading = false; this.cdr.markForCheck(); }
  private release(): void {
    if (this.playback) this.media.stopPlayback(this.streamUuid, this.playback.id).subscribe({error: () => {}});
  }
  ngOnDestroy(): void { this.destroyed = true; this.subscriptions.unsubscribe(); this.release(); }
}
