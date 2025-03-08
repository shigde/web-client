import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {DashboardComponent as AdminDashboardComponent} from './pages/admin/dashboard/dashboard.component';
import {UserAccessGuard} from './guards/user-access-guard.service';
import {LoginComponent} from './pages/auth/login/login.component';
import {LobbyEntryComponent} from './pages/lobby-entry/lobby-entry.component';
import {AdminAccessGuard} from './guards/admin-access-guard.service';

import {SignupComponent} from './pages/auth/signup/signup.component';
import {ActivateAccountComponent} from './pages/auth/activate-account/activate-account.component';
import {ForgotPasswordComponent} from './pages/auth/forgot-password/forgot-password.component';
import {ForgotPasswordMailComponent} from './pages/auth/forgot-password-mail/forgot-password-mail.component';
import {UpdatePasswordComponent} from './pages/auth/update-password/update-password.component';
import {SettingsComponent} from './pages/user/settings/settings.component';
import {ChannelComponent} from './pages/user/channel/channel/channel.component';
import {EditChannelComponent} from './pages/user/channel/edit-channel/edit-channel.component';
import {EditStreamComponent} from './pages/user/stream/edit-stream/edit-stream.component';

const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'dashboard', component: DashboardComponent, canActivate: [UserAccessGuard]},
  {path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminAccessGuard]},
  {path: 'lobby/:spaceId/stream/:streamId', component: LobbyEntryComponent, canActivate: [UserAccessGuard]},
  {path: 'settings', component: SettingsComponent, canActivate: [UserAccessGuard]},
  {path: 'channel/:channelId', component: ChannelComponent},
  {path: 'channel/:channelId/edit', component: EditChannelComponent, canActivate: [UserAccessGuard]},
  {path: 'stream/new', component: EditStreamComponent, canActivate: [UserAccessGuard]},
  {path: 'login', component: LoginComponent},
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
