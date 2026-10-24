import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of, throwError} from 'rxjs';
import {SessionService, UserService} from '@shigde/core';
import {UsersComponent} from './users.component';

describe('Admin users', () => {
  const account = {uuid: 'other', name: 'alice', email: 'alice@example.com', active: true, verified: true, role: 2,
    created_at: '2026-10-24T08:00:00Z', channel_name: 'Alice Live', channel_uuid: 'channel'};
  let service: jasmine.SpyObj<UserService>;
  beforeEach(() => {
    service = jasmine.createSpyObj('UserService', ['getAdminUsers', 'setUserActive', 'setUserRole']);
    service.getAdminUsers.and.returnValue(of({users: [account, {...account, uuid: 'self', name: 'admin', verified: false}], total: 2}));
    service.setUserActive.and.returnValue(of(false));
    service.setUserRole.and.returnValue(of(1));
    TestBed.configureTestingModule({imports: [UsersComponent], providers: [provideRouter([]),
      {provide: UserService, useValue: service},
      {provide: SessionService, useValue: {getUser: () => of({uuid: 'self'})}}
    ]});
  });

  it('shows account and channel information and protects the current account', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('alice@example.com');
    expect(rows[0].textContent).toContain('Alice Live');
    expect(rows[0].children[3].textContent).toContain('Yes');
    expect(rows[1].children[3].textContent).toContain('No');
    expect(rows[0].querySelector('a').getAttribute('href')).toBe('/channel/channel');
    expect(rows[1].textContent).toContain('Your account');
    expect(rows[1].querySelector('button')).toBeNull();
  });

  it('cancels confirmation without changing an account', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('tbody button').click();
    fixture.detectChanges();
    const cancel = fixture.nativeElement.querySelector('[aria-label="Confirm account status change"] button:last-child');
    const style = getComputedStyle(cancel);
    expect(style.color).not.toBe(style.backgroundColor);
    cancel.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Confirm account status change"]')).toBeNull();
    expect(service.setUserActive).not.toHaveBeenCalled();
  });

  it('changes status only after confirmation and shows failures without changing the row', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('tbody button').click();
    fixture.detectChanges();
    expect(service.setUserActive).not.toHaveBeenCalled();
    service.setUserActive.and.returnValue(throwError(() => new Error('unavailable')));
    fixture.nativeElement.querySelector('[aria-label="Confirm account status change"] button').click();
    fixture.detectChanges();
    expect(service.setUserActive).toHaveBeenCalledWith('other', false);
    expect(fixture.componentInstance.users[0].active).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('could not be changed');
    service.setUserActive.and.returnValue(of(false));
    fixture.nativeElement.querySelector('[aria-label="Confirm account status change"] button').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.users[0].active).toBeFalse();
    expect(fixture.nativeElement.querySelector('tbody button').textContent).toContain('Activate');
  });
  it('confirms promotion and demotion and leaves the role unchanged on failure', () => {
    const fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    const roleButton = () => fixture.nativeElement.querySelector('tbody tr button:last-child');
    roleButton().click();
    fixture.detectChanges();
    expect(service.setUserRole).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('[aria-label="Confirm role change"] button').click();
    fixture.detectChanges();
    expect(service.setUserRole).toHaveBeenCalledWith('other', 1);
    expect(fixture.componentInstance.users[0].role).toBe(1);
    expect(roleButton().textContent).toContain('Make User');
    service.setUserRole.and.returnValue(throwError(() => new Error('forbidden')));
    roleButton().click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Confirm role change"] button').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.users[0].role).toBe(1);
    service.setUserRole.and.returnValue(of(2));
    fixture.nativeElement.querySelector('[aria-label="Confirm role change"] button').click();
    fixture.detectChanges();
    expect(service.setUserRole).toHaveBeenCalledWith('other', 2);
    expect(fixture.componentInstance.users[0].role).toBe(2);
  });

});
