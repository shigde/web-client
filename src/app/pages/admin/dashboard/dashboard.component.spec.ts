import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {SessionService, SkipLoading} from '@shigde/core';
import {DashboardComponent} from './dashboard.component';

const system = {
  sampled_at_unix_ms: 0,
  cpu_usage_percent: 0,
  memory_used_bytes: 0,
  memory_total_bytes: 0,
  network_received_bytes_per_second: 0,
  network_transmitted_bytes_per_second: 0,
  disk_read_bytes_per_second: 0,
  disk_written_bytes_per_second: 0,
  root_disk_used_bytes: null,
  root_disk_total_bytes: null,
  history: []
};

describe('Admin monitoring polling', () => {
  it('updates automatically every five seconds and stops polling when unmounted', fakeAsync(() => {
    TestBed.configureTestingModule({imports: [DashboardComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      {provide: SessionService, useValue: {getUser: () => of({uuid: 'admin'})}}]});
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(DashboardComponent);
    tick(0);
    const initial = http.expectOne('/api/poll');
    expect(initial.request.context.get(SkipLoading)).toBeFalse();
    expect(initial.request.body.requests[0].resource).toBe('monitoring');
    initial.flush({results: [{id: initial.request.body.requests[0].id, status: 200, data: {active_lobbies: 1, active_peers: 2, lobbies: [], version: 'test', system, relay: {traffic: [], sessions: []}}}]});
    tick(5000);
    const automatic = http.expectOne('/api/poll');
    expect(automatic.request.context.get(SkipLoading)).toBeTrue();
    automatic.flush({results: [{id: automatic.request.body.requests[0].id, status: 200, data: {active_lobbies: 2, active_peers: 3, lobbies: [], version: 'test', system, relay: {traffic: [], sessions: []}}}]});
    fixture.destroy(); tick(30000);
    http.expectNone('/api/poll');
    http.verify();
  }));
});
