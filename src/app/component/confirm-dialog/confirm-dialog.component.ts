import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <dialog #dialog aria-labelledby="leave-dialog-title" aria-describedby="leave-dialog-description"
            (cancel)="cancel($event)">
      <h2 id="leave-dialog-title">Leave Stream Lobby?</h2>
      <p id="leave-dialog-description">You will disconnect from the stream lobby.</p>
      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" autofocus (click)="finish(false)">Stay</button>
        <button type="button" class="btn btn-primary" (click)="finish(true)">Leave Lobby</button>
      </div>
    </dialog>
  `,
  styles: [`
    dialog { width: min(440px, calc(100vw - 32px)); padding: 24px; border: 1px solid var(--bs-border-color, #ddd);
      border-radius: 8px; color: var(--bs-body-color, #212529); background: var(--bs-body-bg, white);
      box-shadow: 0 12px 40px #0003; }
    dialog::backdrop { background: #0006; }
    h2 { margin: 0 0 12px; font-size: 20px; }
    p { margin: 0 0 24px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
  `],
})
export class ConfirmDialogComponent implements OnDestroy {
  @ViewChild('dialog', {static: true}) private dialog!: ElementRef<HTMLDialogElement>;
  private pending?: Promise<boolean>;
  private resolve?: (confirmed: boolean) => void;

  confirm(): Promise<boolean> {
    if (this.pending) return this.pending;
    this.pending = new Promise(resolve => this.resolve = resolve);
    this.dialog.nativeElement.showModal();
    return this.pending;
  }

  cancel(event: Event): void {
    event.preventDefault();
    this.finish(false);
  }

  finish(confirmed: boolean): void {
    const resolve = this.resolve;
    this.resolve = undefined;
    this.pending = undefined;
    if (this.dialog.nativeElement.open) this.dialog.nativeElement.close();
    resolve?.(confirmed);
  }

  ngOnDestroy(): void { this.finish(false); }
}
