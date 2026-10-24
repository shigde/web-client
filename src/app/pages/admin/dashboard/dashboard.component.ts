import {Component, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ParameterService, PollingService} from '@shigde/core';

interface Snapshot {
  active_lobbies: number;
  active_peers: number;
  lobbies: {lobby_id: string; peers: number}[];
  version: string;
}
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  snapshot: Snapshot | null = null;
  updatedAt: Date | null = null;
  error = false;
  loading = false;
  private readonly polling = inject(PollingService);
  private readonly pollKey = 'admin-monitoring';
  private readonly http = inject(HttpClient);
  private readonly params = inject(ParameterService);

  constructor() {
    this.polling.watch<Snapshot>({
      key: this.pollKey, intervalMs: 15000, requiresSession: true, batch: {resource: 'monitoring'},
      load: context => this.http.get<Snapshot>(`${this.params.API_PREFIX}/admin/monitoring`, {context})
    }).pipe(takeUntilDestroyed()).subscribe(state => {
      this.loading = state.loading;
      this.error = !!state.error;
      this.snapshot = state.data;
      this.updatedAt = state.updatedAt === null ? null : new Date(state.updatedAt);
    });
  }
  refresh(): void { this.polling.refresh(this.pollKey); }
}
