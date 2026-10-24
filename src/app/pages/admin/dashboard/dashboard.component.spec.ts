import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {SessionService, SkipLoading} from '@shigde/core';
import {DashboardComponent} from './dashboard.component';

describe('Admin monitoring polling', () => {
  it('registers only while mounted and distinguishes automatic and manual refresh', fakeAsync(() => {
    TestBed.configureTestingModule({imports: [DashboardComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      {provide: SessionService, useValue: {getUser: () => of({uuid: 'admin'})}}]});
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(DashboardComponent);
    tick(0);
    const initial = http.expectOne('/api/poll');
    expect(initial.request.context.get(SkipLoading)).toBeFalse();
    expect(initial.request.body.requests[0].resource).toBe('monitoring');
    initial.flush({results: [{id: initial.request.body.requests[0].id, status: 200, data: {active_lobbies: 1, active_peers: 2, lobbies: [], version: 'test'}}]});
    tick(15000);
    const automatic = http.expectOne('/api/poll');
    expect(automatic.request.context.get(SkipLoading)).toBeTrue();
    automatic.flush({results: [{id: automatic.request.body.requests[0].id, status: 200, data: {active_lobbies: 2, active_peers: 3, lobbies: [], version: 'test'}}]});
    fixture.componentInstance.refresh(); tick(0);
    const manual = http.expectOne('/api/poll');
    expect(manual.request.context.get(SkipLoading)).toBeFalse();
    manual.flush({results: [{id: manual.request.body.requests[0].id, status: 200, data: {active_lobbies: 2, active_peers: 3, lobbies: [], version: 'test'}}]});
    fixture.destroy(); tick(30000);
    http.expectNone('/api/poll');
    http.verify();
  }));
});
