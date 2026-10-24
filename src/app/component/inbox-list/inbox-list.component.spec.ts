import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {of} from 'rxjs';
import {SessionService, SkipLoading} from '@shigde/core';
import {InboxListComponent} from './inbox-list.component';

describe('Batched inbox list', () => {
  const item = {id: 'entry', title: 'Stream invitation', body: 'Host invited you to <Stream>', read_at: null,
    created_at: '2026-10-24T12:00:00Z', action_path: '/channel/c/stream/s/lobby'};
  let http: HttpTestingController;
  function respond(background: boolean) {
    const request = http.expectOne('/api/poll');
    expect(request.request.context.get(SkipLoading)).toBe(background);
    expect(request.request.body.requests[0].resource).toBe('messages');
    request.flush({results: [{id: request.request.body.requests[0].id, status: 200, data: {items: [item], total: 1, unread: 1}}]});
  }
  beforeEach(() => {
    TestBed.configureTestingModule({imports: [InboxListComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      {provide: SessionService, useValue: {getUser: () => of({uuid: 'guest'})}}]});
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('shows a batched message and saves its read state before opening the stream', fakeAsync(() => {
    const fixture = TestBed.createComponent(InboxListComponent);
    const router = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges(); tick(0); respond(false); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Host invited you to <Stream>');
    fixture.nativeElement.querySelector('.btn-primary').click();
    expect(router).not.toHaveBeenCalled();
    http.expectOne('/api/messages/entry/read').flush({data: true});
    expect(router).toHaveBeenCalledWith('/channel/c/stream/s/lobby');
    fixture.destroy();
  }));
  it('keeps the normal loader for opening and manual refresh, and skips it for timer batches', fakeAsync(() => {
    const fixture = TestBed.createComponent(InboxListComponent);
    fixture.detectChanges(); tick(0); respond(false);
    tick(15000); respond(true);
    fixture.componentInstance.refresh(); tick(0); respond(false);
    fixture.destroy(); tick(30000); http.expectNone('/api/poll');
  }));
  it('keeps the entry visible after a failed read update', fakeAsync(() => {
    const fixture = TestBed.createComponent(InboxListComponent);
    fixture.detectChanges(); tick(0); respond(false); fixture.detectChanges();
    fixture.componentInstance.read(item);
    http.expectOne('/api/messages/entry/read').flush({}, {status: 500, statusText: 'Unavailable'});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Could not mark');
    expect(fixture.componentInstance.items[0].read_at).toBeNull();
    fixture.destroy();
  }));
});
