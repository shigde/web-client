import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {LobbyComponent} from './lobby/lobby.component';
import {LiveStreamComponent} from './live-stream/live-stream.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'lobby/:spaceId/stream/:streamId', component: LobbyComponent },
  { path: 'stream/:id', component: LiveStreamComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
