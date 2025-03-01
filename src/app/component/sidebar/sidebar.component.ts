import { Component } from '@angular/core';
import {AvatarComponent} from '../avatar/avatar.component';
import {SessionService} from '../../../../../shig-js-sdk/dist/core';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
    selector: 'app-sidebar',
    imports: [
        AvatarComponent,
        AsyncPipe
    ],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  public readonly userName$: Observable<string>;

  constructor(private session: SessionService, private router: Router) {
    this.userName$ = session.getUserName()
  }

  public logout(): void {
    this.session.clearData()
    this.router.navigate(['login']);
  }

}
