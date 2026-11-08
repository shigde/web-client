import {MessagesComponent} from './pages/messages/messages.component';
import {UsersComponent as AdminUsersComponent} from './pages/admin/users/users.component';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {DashboardComponent as AdminDashboardComponent} from './pages/admin/dashboard/dashboard.component';
import {UserAccessGuard} from './guards/user-access-guard.service';
import {LobbyEntryComponent} from './pages/lobby-entry/lobby-entry.component';
import {lobbyLeaveGuard} from './guards/lobby-leave.guard';
import {AdminAccessGuard} from './guards/admin-access-guard.service';

import {
  ActivateAccountComponent, DeviceCameraComponent, ForgotPasswordComponent,
  ForgotPasswordMailComponent, LoginComponent, SignupComponent,
} from './pages/auth';
import {SettingsComponent} from './pages/user/settings/settings.component';
import {ChannelComponent} from './pages/user/channel/channel/channel.component';
import {EditChannelComponent} from './pages/user/channel/edit-channel/edit-channel.component';
import {EditStreamComponent} from './pages/user/stream/edit-stream/edit-stream.component';
import {StreamComponent} from './pages/user/stream/stream/stream.component';

const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'dashboard', component: DashboardComponent, canActivate: [UserAccessGuard]},
  {path: 'admin/dashboard', redirectTo: 'admin/monitoring', pathMatch: 'full'},
  {path: 'admin/users', component: AdminUsersComponent, canActivate: [AdminAccessGuard]},
  {path: 'admin/monitoring', component: AdminDashboardComponent, canActivate: [AdminAccessGuard]},
  {path: 'messages', component: MessagesComponent, canActivate: [UserAccessGuard]},
  {path: 'settings', component: SettingsComponent, canActivate: [UserAccessGuard]},
  {path: 'channel/:channelUuid', component: ChannelComponent},
  {path: 'channel/:channelUuid/edit', component: EditChannelComponent, canActivate: [UserAccessGuard]},
  {path: 'stream/new', component: EditStreamComponent, canActivate: [UserAccessGuard]},
  {path: 'stream/:streamUuid', component: StreamComponent, canActivate: [UserAccessGuard]},
  {path: 'video/:streamUuid', component: StreamComponent, data: {type: 'video'}, canActivate: [UserAccessGuard]},
  {path: 'stream/:streamUuid/edit', component: EditStreamComponent, canActivate: [UserAccessGuard]},
  {path: 'channel/:channelUuid/stream/:streamUuid/lobby', component: LobbyEntryComponent, canActivate: [UserAccessGuard], canDeactivate: [lobbyLeaveGuard]},
  {path: 'login', component: LoginComponent},
  {path: 'camera', component: DeviceCameraComponent},
  {path: 'forgotPasswordMail', component: ForgotPasswordMailComponent},
  {path: 'forgotPassword/:token', component: ForgotPasswordComponent},
  {path: 'signup', component: SignupComponent},
  {path: 'activateAccount/:token', component: ActivateAccountComponent}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
