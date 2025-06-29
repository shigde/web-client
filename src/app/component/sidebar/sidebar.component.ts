import {Component} from '@angular/core';
import {AvatarComponent} from '../avatar/avatar.component';
import {SessionService} from '@shigde/core';
import {Router} from '@angular/router';
import {filter, Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {User} from '@shigde/core';
import {map} from 'rxjs/operators';


export interface SidebarUser extends User {
  domainName: string;
}

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
  public user$?: Observable<SidebarUser>;

  constructor(private session: SessionService, private router: Router) {
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
