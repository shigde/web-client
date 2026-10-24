import {Component, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ParameterService} from '@shigde/core';
import {catchError, exhaustMap, of, Subject, merge, timer} from 'rxjs';

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
  private readonly refreshRequests = new Subject<void>();
  private readonly http = inject(HttpClient);
  private readonly params = inject(ParameterService);

  constructor() {
    merge(timer(0, 15000), this.refreshRequests).pipe(
      exhaustMap(() => {
        this.loading = true;
        return this.http.get<Snapshot>(`${this.params.API_PREFIX}/admin/monitoring`).pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed()
    ).subscribe(snapshot => {
      this.loading = false;
      this.error = snapshot === null;
      if (snapshot) {
        this.snapshot = snapshot;
        this.updatedAt = new Date();
      }
    });
  }
  refresh(): void { this.refreshRequests.next(); }
}
