import {Component, DestroyRef, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AdminUser, Role, SessionService, UserService} from '@shigde/core';
import {catchError, of, startWith, Subject, switchMap} from 'rxjs';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './users.component.html'
})
export class UsersComponent {
  users: AdminUser[] = [];
  total = 0;
  offset = 0;
  search = '';
  appliedSearch = '';
  loading = true;
  saving = false;
  error = '';
  message = '';
  currentUuid = '';
  pending: AdminUser | null = null;
  pendingRole: AdminUser | null = null;
  streamingMode: 'request' | 'open' | 'locked' | null = null;
  streamingPolicyLoaded = false;
  readonly Role = Role;
  readonly pageSize = 50;
  private readonly service = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();

  constructor() {
    inject(SessionService).getUser().pipe(takeUntilDestroyed()).subscribe(user => this.currentUuid = user?.uuid ?? '');
    this.service.getStreamingPolicy().pipe(takeUntilDestroyed(), catchError(() => of(null))).subscribe(policy => {
      this.streamingMode = policy?.mode ?? null;
      this.streamingPolicyLoaded = true;
    });
    this.reload.pipe(
      startWith(undefined),
      switchMap(() => {
        this.loading = true;
        this.error = '';
        this.pending = null;
        this.pendingRole = null;
        return this.service.getAdminUsers(this.appliedSearch, this.offset).pipe(catchError(() => of(null)));
      }), takeUntilDestroyed()
    ).subscribe(page => {
      this.loading = false;
      this.users = page?.users ?? [];
      this.total = page?.total ?? 0;
      if (!page) this.error = 'Accounts could not be loaded. Please try again.';
    });
  }

  find(): void {
    this.appliedSearch = this.search.trim();
    this.offset = 0;
    this.message = '';
    this.reload.next();
  }

  go(offset: number): void {
    this.offset = offset;
    this.reload.next();
  }

  confirm(): void {
    const user = this.pending;
    if (!user || this.saving) return;
    this.saving = true;
    this.error = '';
    this.message = '';
    this.service.setUserActive(user.uuid, !user.active).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: active => {
        this.users = this.users.map(row => row.uuid === user.uuid ? {...row, active} : row);
        this.message = `${user.name}: account ${active ? 'activated' : 'blocked'}.`;
        this.pending = null;
        this.saving = false;
      },
      error: () => {
        this.error = 'Account status could not be changed. Please try again.';
        this.saving = false;
      }
    });
  }

  roleName(role: Role): string {
    return {0: 'Anonymous', 1: 'Admin', 2: 'User', 3: 'Guest', 4: 'Application', 5: 'Service', 6: 'Organisation'}[role] ?? 'Unknown';
  }

  confirmRole(): void {
    const user = this.pendingRole;
    if (!user || this.saving) return;
    this.saving = true;
    this.error = '';
    this.message = '';
    const role = user.role === Role.ADMIN ? Role.USER : Role.ADMIN;
    this.service.setUserRole(user.uuid, role).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updatedRole => {
        this.users = this.users.map(row => row.uuid === user.uuid ? {...row, role: updatedRole} : row);
        this.message = `${user.name}: role changed to ${this.roleName(updatedRole)}.`;
        this.pendingRole = null;
        this.saving = false;
      },
      error: () => {
        this.error = 'Role could not be changed. Refresh the list and check your admin access.';
        this.saving = false;
      }
    });
  }

  setStreaming(user: AdminUser, status: 'inherited' | 'allowed' | 'blocked'): void {
    if (!user.channel_uuid || this.saving || !this.streamingMode || (this.streamingMode === 'locked' && status === 'allowed')) return;
    const warning = status === 'blocked'
      ? `Block ${user.name}'s channel? This stops its live stream and unpublishes all of its public streams and recordings. The account itself remains active.`
      : status === 'inherited' && user.streaming_status
        ? `Remove the individual ${user.streaming_status} setting for ${user.name}? The channel will follow the server's current default policy.`
        : '';
    if (warning && !confirm(warning)) return;
    this.saving = true; this.error = ''; this.message = '';
    this.service.setChannelStreaming(user.channel_uuid, status).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.users = this.users.map(row => row.uuid === user.uuid ? {...row, streaming_status: status === 'inherited' ? null : status} : row);
        this.message = status === 'allowed'
          ? `${user.name}: streaming permission granted.`
          : status === 'blocked'
            ? `${user.name}: channel blocked from streaming.`
            : `${user.name}: individual streaming setting removed; server default applies.`;
        this.saving = false;
      },
      error: () => { this.error = 'Channel streaming permission could not be changed.'; this.saving = false; }
    });
  }
}
