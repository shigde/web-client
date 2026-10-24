import {Component} from '@angular/core';
import {AvatarComponent} from '../avatar/avatar.component';
import {Role, SessionService, User} from '@shigde/core';
import {Router, RouterLink} from '@angular/router';
import {filter, Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {map} from 'rxjs/operators';


export interface SidebarUser extends User {
  domainName: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    AvatarComponent,
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  public user$?: Observable<SidebarUser>;
  readonly isAdmin$: Observable<boolean>;

  constructor(private session: SessionService, private router: Router) {
    this.isAdmin$ = this.session.getUserRole().pipe(map(role => role === Role.ADMIN));
    this.user$ = this.session.getUser().pipe(
      filter(u => u != null),
      map(u => ({...u, domainName: u.name + '@' + u.domain} as SidebarUser)),
    );
  }

  public logout(): void {
    this.session.clearData();
    this.router.navigate(['login']);
  }

}
