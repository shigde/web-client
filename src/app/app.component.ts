import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {SessionService} from '@shigde/core';
import {ThemeService} from './providers/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  user$: Observable<string>;
  title = 'shig-web-client';

  constructor(private router: Router, private session: SessionService, private theme: ThemeService) {
    this.user$ = session.getUserName();

  }

  ngOnInit(): void {
    this.theme.init();
  }

  logout() {
    this.session.clearData();
    this.router.navigate(['login']);
  }
}
