import {CanDeactivateFn} from '@angular/router';
import {LobbyEntryComponent} from '../pages/lobby-entry/lobby-entry.component';

export const lobbyLeaveGuard: CanDeactivateFn<LobbyEntryComponent> = component => component.canLeave();
