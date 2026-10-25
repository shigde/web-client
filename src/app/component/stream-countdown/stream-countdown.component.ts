import {Component, DestroyRef, Input, OnInit, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {interval} from 'rxjs';

@Component({
  selector: 'app-stream-countdown',
  standalone: true,
  template: `
    @if (validDate) {
      <div class="start-date"><time [attr.datetime]="startDate.toISOString()">{{ formattedDate }}</time></div>
      @if (remaining > 0) {
        <div class="countdown" role="timer" aria-label="Time until scheduled stream start">
          @for (part of parts; track part.label) {
            <div><span class="value">{{ part.value }}</span><span class="unit">{{ part.label }}</span></div>
          }
        </div>
      } @else {
        <div class="waiting" role="status">Waiting for stream to start</div>
      }
    }
  `,
  styles: [`
    :host { display: block; padding: 12px 16px; color: #fff; background: rgba(0,0,0,.72); border-radius: var(--bs-border-radius); max-width: 100%; }
    .start-date { font-size: .875rem; margin-bottom: 8px; overflow-wrap: anywhere; }
    .countdown { display: flex; justify-content: flex-end; gap: 18px; }
    .countdown > div { display: flex; flex-direction: column; align-items: center; }
    .value { font-size: clamp(1.3rem, 3vw, 2rem); font-weight: 600; line-height: 1.2; font-variant-numeric: tabular-nums; }
    .unit { font-size: .7rem; opacity: .8; margin-top: 3px; }
    .waiting { font-size: .875rem; }
    @media(max-width:575.98px) { :host { padding: 8px 10px; } .countdown { gap: 14px; } .start-date { font-size: .75rem; } }
  `],
})
export class StreamCountdownComponent implements OnInit {
  @Input({required: true}) date!: Date | string;
  private readonly destroyRef = inject(DestroyRef);
  readonly now = signal(Date.now());
  get startDate(): Date { return new Date(this.date); }
  get validDate(): boolean { return Number.isFinite(this.startDate.getTime()); }
  get formattedDate(): string {
    return new Intl.DateTimeFormat(navigator.language, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'}).format(this.startDate);
  }
  get remaining(): number { return Math.max(0, Math.ceil((this.startDate.getTime() - this.now()) / 1000)); }
  get parts(): {label: string, value: string}[] {
    const s = this.remaining;
    return [{label: 'Days', n: Math.floor(s / 86400)}, {label: 'Hours', n: Math.floor(s / 3600) % 24}, {label: 'Min', n: Math.floor(s / 60) % 60}, {label: 'Sec', n: s % 60}]
      .map(p => ({label: p.label, value: String(p.n).padStart(2, '0')}));
  }
  ngOnInit(): void {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.now.set(Date.now()));
  }
}
