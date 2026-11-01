import {Component, EventEmitter, Input, OnDestroy, Output, signal, TemplateRef} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {RecordedVideo, VideoService} from '@shigde/core';
import {finalize, take} from 'rxjs';

@Component({
  selector: 'app-replay-actions',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './replay-actions.component.html',
  styleUrl: './replay-actions.component.scss',
})
export class ReplayActionsComponent implements OnDestroy {
  @Input({required: true}) video!: RecordedVideo;
  @Output() saved = new EventEmitter<RecordedVideo>();
  @Output() deleted = new EventEmitter<string>();
  readonly busy = signal(false);
  readonly error = signal('');
  title = '';
  description = '';
  support = '';
  published = false;
  private dialog?: NgbModalRef;

  constructor(private videos: VideoService, private modal: NgbModal) {}

  ngOnDestroy(): void { this.dialog?.dismiss(); }

  get active(): boolean { return ['recording', 'processing'].includes(this.video.status); }

  togglePublished(event: Event): void {
    const input = event.target as HTMLInputElement;
    const published = input.checked;
    // Reflect the persisted state until the server confirms the change. This also
    // restores the switch reliably when the request fails synchronously.
    input.checked = !!this.video.publishedAt;
    if (this.busy() || this.video.status !== 'ready') return;
    this.setPublished(published);
  }

  edit(template: TemplateRef<unknown>): void {
    this.title = this.video.title;
    this.description = this.video.description;
    this.support = this.video.support;
    this.published = !!this.video.publishedAt;
    this.open(template);
  }

  open(template: TemplateRef<unknown>): void {
    this.error.set('');
    this.dialog = this.modal.open(template, {backdrop: 'static', keyboard: false, centered: true});
  }

  save(): void {
    if (this.busy() || !this.title.trim()) return;
    this.update({title: this.title.trim(), description: this.description, support: this.support,
      published: this.published, ...(this.published ? {isPublic: true} : {})}, true);
  }

  setPublished(published: boolean): void {
    if (this.video.status !== 'ready') return;
    this.update({published, ...(published ? {isPublic: true} : {})});
  }

  private update(changes: Parameters<VideoService['update']>[1], close = false): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.videos.update(this.video.uuid, changes).pipe(take(1), finalize(() => this.busy.set(false)))
      .subscribe({next: video => {
        this.video = video;
        if (close) this.dialog?.close();
        this.saved.emit(video);
      }, error: () => this.error.set('The replay could not be updated. Please try again.')});
  }

  deletePermanently(): void {
    if (this.busy() || this.active) return;
    this.busy.set(true);
    this.error.set('');
    this.videos.delete(this.video.uuid).pipe(take(1), finalize(() => this.busy.set(false)))
      .subscribe({next: () => {
        this.dialog?.close();
        this.deleted.emit(this.video.uuid);
      }, error: () => {
        this.error.set('Deletion could not be completed. Please retry; some replay files may already have been removed.');
        this.videos.get(this.video.uuid).pipe(take(1)).subscribe({
          next: video => { this.video = video; this.saved.emit(video); }, error: () => {},
        });
      }});
  }
}
