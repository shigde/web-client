import {Component, Input} from '@angular/core';
import {RecordedVideo} from '@shigde/core';

const STATUS = {
  pending: {label: 'Waiting to record', icon: 'bi-clock', description: 'The recording has not started yet.'},
  recording: {label: 'Recording', icon: 'bi-record-circle', description: 'The recording is still running.'},
  processing: {label: 'Processing', icon: 'bi-hourglass-split', description: 'The replay is being prepared for playback.'},
  ready: {label: 'Ready', icon: 'bi-check-circle', description: 'This replay is ready to watch.'},
  failed: {label: 'Recording failed', icon: 'bi-exclamation-triangle', description: 'This recording could not be completed.'},
  deleting: {label: 'Deletion pending', icon: 'bi-trash', description: 'This replay is being deleted. If deletion was interrupted, choose Delete permanently to retry.'},
};

@Component({
  selector: 'app-replay-status',
  standalone: true,
  host: {'[class.icon-only]': 'iconOnly'},
  template: `
    <div [class.status-panel]="panel" [class.status-failed]="status === 'failed'" role="status">
      @if (panel) {
        <i class="bi status-icon" [class]="'bi status-icon ' + presentation.icon" aria-hidden="true"></i>
        <h2>{{ presentation.label }}</h2>
        <p class="text-body-secondary mb-0">{{ presentation.description }}</p>
      } @else {
        <span class="status-label" [class.text-danger]="status === 'failed'" [title]="presentation.label">
          <i [class]="'bi ' + presentation.icon" aria-hidden="true"></i>
          <span [class.visually-hidden]="iconOnly">{{ presentation.label }}</span>
        </span>
      }
    </div>
    @if (error) {
      <details class="status-details text-body-secondary">
        <summary>Technical details</summary>
        <pre>{{ error }}</pre>
      </details>
    }
  `,
  styles: `
    :host { display: block; min-width: 0; }
    :host.icon-only { display: inline-flex; flex-shrink: 0; }
    :host.icon-only .status-label { font-size: 1rem; }
    .status-label { display: inline-flex; align-items: center; gap: .4rem; font-size: .875rem; }
    .status-panel { min-height: 240px; padding: 2rem 1rem; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: .75rem; text-align: center; background: var(--bs-tertiary-bg); }
    .status-icon { font-size: 2rem; color: var(--bs-secondary-color); }
    .status-failed .status-icon { color: var(--bs-warning-text-emphasis); }
    h2 { font-size: 1.25rem; margin: 0; }
    .status-details { font-size: .8rem; margin-top: .5rem; }
    .status-details summary { cursor: pointer; }
    .status-details pre { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 160px;
      overflow: auto; margin: .5rem 0 0; font-size: inherit; }
  `,
})
export class ReplayStatusComponent {
  @Input({required: true}) status!: RecordedVideo['status'];
  @Input() error: string | null = null;
  @Input() panel = false;
  @Input() iconOnly = false;
  get presentation() { return STATUS[this.status]; }
}
