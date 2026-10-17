import {convertToParamMap} from '@angular/router';
import {of} from 'rxjs';
import {LobbyComponent} from '@shigde/core';
import {LobbyEntryComponent} from './lobby-entry.component';

describe('Lobby navigation', () => {
  let component: LobbyEntryComponent;
  let leave: jasmine.Spy;
  let confirm: jasmine.Spy;

  beforeEach(() => {
    component = new LobbyEntryComponent(
      {snapshot: {paramMap: convertToParamMap({streamUuid: 'stream', channelUuid: 'channel'})}} as any,
      {} as any, {} as any,
      {getAuthenticationToken: () => 'token', getUser: () => of({uuid: 'guest'})} as any,
      {apiPrefix: '/api', relayService: 'https://relay.test/live'} as any,
    );
    leave = jasmine.createSpy('leave').and.resolveTo();
    confirm = jasmine.createSpy('confirm').and.resolveTo(false);
    component.leaveDialog = {confirm} as any;
  });

  it('allows leaving setup without confirmation', async () => {
    component.lobby = {connectionActive: false, leaveCurrentLobby: leave} as unknown as LobbyComponent;
    expect(await component.canLeave()).toBeTrue();
    expect(confirm).not.toHaveBeenCalled();
    expect(leave).not.toHaveBeenCalled();
  });

  it('keeps an active call when leaving is cancelled', async () => {
    confirm.and.resolveTo(false);
    component.lobby = {connectionActive: true, leaveCurrentLobby: leave} as unknown as LobbyComponent;
    expect(await component.canLeave()).toBeFalse();
    expect(leave).not.toHaveBeenCalled();
  });

  it('waits for cleanup before allowing navigation', async () => {
    confirm.and.resolveTo(true);
    let finish!: () => void;
    leave.and.returnValue(new Promise<void>(resolve => finish = resolve));
    component.lobby = {connectionActive: true, leaveCurrentLobby: leave} as unknown as LobbyComponent;
    let allowed = false;
    const leaving = component.canLeave().then(result => allowed = result);
    await Promise.resolve();
    expect(allowed).toBeFalse();
    finish();
    await leaving;
    expect(allowed).toBeTrue();
  });

  it('warns on tab close while connected or joining', () => {
    const event = {preventDefault: jasmine.createSpy('preventDefault'), returnValue: undefined} as unknown as BeforeUnloadEvent;
    component.lobby = {connectionActive: true} as LobbyComponent;
    component.beforeUnload(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe('');
  });
});
