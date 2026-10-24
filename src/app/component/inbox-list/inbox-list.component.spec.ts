import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';
import {MessageService, NotificationService, SessionService} from '@shigde/core';
import {InboxListComponent} from './inbox-list.component';

describe('Inbox list', () => {
  let service: jasmine.SpyObj<MessageService>;
  const item = {id: 'entry', title: 'Stream invitation', body: 'Host invited you to <Stream>',
    read_at: null, created_at: '2026-10-24T12:00:00Z', action_path: '/channel/c/stream/s/lobby'};
  beforeEach(() => {
    service = jasmine.createSpyObj('Inbox', ['list', 'markRead', 'markAllRead']);
    service.list.and.returnValue(of({items: [item], total: 1, unread: 1}));
    TestBed.configureTestingModule({imports: [InboxListComponent], providers: [provideRouter([]),
      {provide: MessageService, useValue: service}, {provide: NotificationService, useValue: service},
      {provide: SessionService, useValue: {getUser: () => of({uuid: 'guest'})}}]});
  });
  it('shows the message and saves its read state before opening the stream', fakeAsync(() => {
    const fixture = TestBed.createComponent(InboxListComponent);
    const router = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges(); tick(0); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Host invited you to <Stream>');
    expect(service.markRead).not.toHaveBeenCalled();
    const saved = new Subject<boolean>(); service.markRead.and.returnValue(saved);
    fixture.nativeElement.querySelector('.btn-primary').click();
    expect(service.markRead).toHaveBeenCalledWith('entry');
    expect(router).not.toHaveBeenCalled();
    saved.next(true); saved.complete();
    expect(router).toHaveBeenCalledWith('/channel/c/stream/s/lobby');
    fixture.destroy();
  }));
  it('uses the normal loader for opening and manual refresh, and skips it for timer refresh', fakeAsync(() => {
    const fixture = TestBed.createComponent(InboxListComponent);
    fixture.detectChanges(); tick(0);
    expect(service.list).toHaveBeenCalledWith(0, false);
    service.list.calls.reset();
    tick(15000);
    expect(service.list).toHaveBeenCalledOnceWith(0, true);
    service.list.calls.reset();
    fixture.componentInstance.refresh();
    expect(service.list).toHaveBeenCalledOnceWith(0, false);
    fixture.destroy();
  }));

  it('keeps the entry visible and reports failed read updates', fakeAsync(() => {
    const fixture = TestBed.createComponent(InboxListComponent);
    fixture.detectChanges(); tick(0); fixture.detectChanges();
    service.markRead.and.returnValue(throwError(() => new Error('offline')));
    fixture.componentInstance.read(item);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Could not mark');
    expect(fixture.componentInstance.items[0].read_at).toBeNull();
    fixture.destroy();
  }));
});
