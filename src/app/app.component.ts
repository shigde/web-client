import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, switchMap, take} from 'rxjs';
import {SessionService} from '@shigde/core';
import {ThemeService} from './providers/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'shig-web-client';

  protected get devicePage(): boolean {
    return this.router.routerState.snapshot.root.firstChild?.data['deviceSession'] === true;
  }

  constructor(private router: Router, private session: SessionService, private theme: ThemeService) {
    router.events.pipe(
      filter(event => event instanceof NavigationEnd && !this.devicePage),
      take(1),
      filter(() => session.isAuthenticated()),
      switchMap(() => session.initPrincipal()),
    ).subscribe();
  }

  ngOnInit(): void {
    this.theme.init();
  }

  logout() {
    this.session.clearData();
    this.router.navigate(['login']);
  }
}
