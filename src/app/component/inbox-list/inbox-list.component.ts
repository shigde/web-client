import {Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SkipLoading, InboxEntry, MessageService, NotificationService, PollingService, SessionService} from '@shigde/core';
import {BehaviorSubject, distinctUntilChanged, map, of, switchMap} from 'rxjs';

@Component({selector: 'app-inbox-list', imports: [DatePipe], templateUrl: './inbox-list.component.html'})
export class InboxListComponent implements OnInit {
  @Output() opened = new EventEmitter<void>();
  @Input() kind: 'messages' | 'notifications' = 'messages';
  items: InboxEntry[] = [];
  total = 0;
  unread = 0;
  offset = 0;
  loading = true;
  busy = false;
  error = '';
  private readonly messages = inject(MessageService);
  private readonly notifications = inject(NotificationService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly offsetChanges = new BehaviorSubject(0);
  private readonly polling = inject(PollingService);
  private get pollKey(): string { return `inbox-list:${this.kind}:${this.offset}`; }
  private get service() { return this.kind === 'messages' ? this.messages : this.notifications; }

  ngOnInit(): void {
    this.session.getUser().pipe(
      map(user => user?.uuid), distinctUntilChanged(),
      switchMap(uuid => {
        this.loading = true; this.items = []; this.offsetChanges.next(0); this.offset = 0; this.total = 0; this.unread = 0;
        return uuid ? this.offsetChanges.pipe(switchMap(offset => {
          this.offset = offset;
          return this.polling.watch({
          key: this.pollKey, intervalMs: 15000, requiresSession: true, batch: {resource: this.kind, offset},
          load: context => this.service.list(this.offset, context.get(SkipLoading)),
          });
        })) : of(null);
      }), takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      this.loading = state?.loading ?? false;
      if (state?.error) this.error = 'Inbox could not be loaded. Please try again.';
      else this.error = '';
      const page = state?.data;
      if (page) { this.items = page.items; this.total = page.total; this.unread = page.unread; }
    });
  }
  refresh(): void { this.polling.refresh(this.pollKey); }
  page(offset: number): void {
    this.offsetChanges.next(offset);
  }

  read(item: InboxEntry, open = false): void {
    if (this.busy) return;
    if (item.read_at) { if (open && item.action_path) this.open(item.action_path); return; }
    this.busy = true;
    this.service.markRead(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy = false; this.refresh(); if (open && item.action_path) this.open(item.action_path); },
      error: () => { this.busy = false; this.error = 'Could not mark this entry as read. Please try again.'; }
    });
  }
  readAll(): void {
    this.busy = true;
    this.service.markAllRead().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy = false; this.refresh(); },
      error: () => { this.busy = false; this.error = 'Could not mark entries as read. Please try again.'; }
    });
  }
  private open(path: string): void {
    this.opened.emit();
    this.router.navigateByUrl(path);
  }
}
