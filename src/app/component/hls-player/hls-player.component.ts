import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, signal, SimpleChanges, ViewChild} from '@angular/core';
import type Hls from 'hls.js';

@Component({
  selector: 'app-hls-player',
  standalone: true,
  template: `
    <video #video controls playsinline preload="metadata" [poster]="poster"
           aria-label="Recorded video" (error)="onMediaError()"></video>
    @if (error()) { <p class="player-error" role="alert">{{ error() }}</p> }
  `,
  styles: `
    :host { display: block; background: #000; }
    video { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: contain; }
    .player-error { color: #fff; padding: 1rem; margin: 0; }
  `,
})
export class HlsPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({required: true}) src = '';
  @Input() poster = '';
  @ViewChild('video', {static: true}) private video!: ElementRef<HTMLVideoElement>;
  readonly error = signal('');
  private hls?: Hls;
  private ready = false;
  private revision = 0;

  ngAfterViewInit(): void {
    this.ready = true;
    void this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.ready && changes['src']) void this.load();
  }

  ngOnDestroy(): void {
    this.ready = false;
    this.revision++;
    this.reset();
  }

  onMediaError(): void {
    if (this.ready && this.video.nativeElement.error) {
      const mediaError = this.video.nativeElement.error;
      console.error('[HLS player] Video element error', {
        code: mediaError?.code,
        message: mediaError?.message,
        ...this.playbackDiagnostics(),
      });
      this.error.set('This video could not be played. Please try again later.');
    }
  }

  private async load(): Promise<void> {
    const revision = ++this.revision;
    this.reset();
    this.error.set('');
    if (!this.src) return;
    try {
      // Keep the HLS playback engine out of the live-player loading path.
      const {default: Hls} = await import('hls.js');
      if (!this.ready || revision !== this.revision) return;
      const video = this.video.nativeElement;
      if (Hls.isSupported()) {
        const hls = this.hls = new Hls();
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!this.ready || revision !== this.revision) return;
          const diagnostics = {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
            reason: data.reason,
            error: data.error,
            segmentUrl: data.frag?.url,
            segmentNumber: data.frag?.sn,
            segmentStart: data.frag?.start,
            segmentDuration: data.frag?.duration,
            response: data.response,
            ...this.playbackDiagnostics(),
          };
          if (data.fatal) {
            console.error('[HLS player] Fatal HLS error', diagnostics);
            this.error.set('This video could not be played. Please try again later.');
          } else {
            console.warn('[HLS player] HLS warning', diagnostics);
          }
        });
        hls.loadSource(this.src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = this.src;
      } else {
        this.error.set('This browser does not support HLS video playback.');
      }
    } catch (error) {
      if (this.ready && revision === this.revision) {
        console.error('[HLS player] Player loading failed', error, this.playbackDiagnostics());
        this.error.set('The video player could not be loaded. Please reload the page.');
      }
    }
  }

  private playbackDiagnostics() {
    const video = this.video.nativeElement;
    return {
      source: this.src,
      currentTime: video.currentTime,
      buffered: Array.from({length: video.buffered.length}, (_, index) => ({
        start: video.buffered.start(index),
        end: video.buffered.end(index),
      })),
      readyState: video.readyState,
      networkState: video.networkState,
      paused: video.paused,
      seeking: video.seeking,
    };
  }

  private reset(): void {
    this.hls?.destroy();
    this.hls = undefined;
    const video = this.video.nativeElement;
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}
