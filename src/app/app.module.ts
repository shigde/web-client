import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {HttpClientModule} from '@angular/common/http';
import {LobbyComponent} from './lobby/lobby.component';
import {LiveStreamComponent} from './live-stream/live-stream.component';
import {NgbDropdownModule, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LoginComponent} from './login/login.component';
import {CommonModule} from '@angular/common';
import {httpInterceptorProviders} from '@shig/core';
import {LobbyEntryComponent} from './lobby-entry/lobby-entry.component';
import {DeviceSettingsComponent} from './device-settings/device-settings.component';


@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        LiveStreamComponent,
        LoginComponent,
        LobbyComponent,
        LobbyEntryComponent,
        DeviceSettingsComponent
    ],
    imports: [
        CommonModule,
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        NgbModule,
        NgbDropdownModule,
        ReactiveFormsModule,
        FormsModule
    ],
    providers: [
        httpInterceptorProviders,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
