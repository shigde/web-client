import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {AsyncPipe, NgIf} from '@angular/common';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {AvatarComponent} from '../avatar/avatar.component';
import {SessionService} from '@shigde/core';
import {SidebarComponent} from '../sidebar/sidebar.component';

@Component({
    selector: 'app-header',
    imports: [
        AsyncPipe,
        NgIf,
        SidebarComponent
    ],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {
  public readonly isUserLogin$: Observable<boolean>;

  constructor(session: SessionService, private router: Router) {
    this.isUserLogin$ = session.getUserName().pipe(
      map((name) => name !== 'anonymous')
    );
  }
}
