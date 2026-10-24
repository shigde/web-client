import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {BehaviorSubject, of} from 'rxjs';
import {MessageService, NotificationService, Role, SessionService} from '@shigde/core';
import {HeaderComponent} from './header.component';

describe('Header inbox controls', () => {
  it('shows actual unread badges, opens the notification list and links to messages', fakeAsync(() => {
    const counts = new BehaviorSubject({total: 1, unread: 1});
    const inbox = {counts$: counts.asObservable(), list: () => of({items: [], total: 0, unread: 0})};
    TestBed.configureTestingModule({imports: [HeaderComponent], providers: [provideRouter([]),
      {provide: SessionService, useValue: {getUserName: () => of('guest'), getUser: () => of({uuid: 'guest', name: 'Guest'}), getUserRole: () => of(Role.USER)}},
      {provide: MessageService, useValue: inbox}, {provide: NotificationService, useValue: inbox}]});
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const bell = fixture.nativeElement.querySelector('[aria-label="Notifications"]');
    expect(bell.querySelector('.bg-danger')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Messages"]').getAttribute('href')).toBe('/messages');
    bell.click(); fixture.detectChanges(); tick(0); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#notification-inbox')).not.toBeNull();
    counts.next({total: 1, unread: 0}); fixture.detectChanges();
    expect(bell.querySelector('.bg-danger')).toBeNull();
    fixture.componentInstance.closeNotifications(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#notification-inbox')).toBeNull();
    fixture.destroy();
  }));
});
