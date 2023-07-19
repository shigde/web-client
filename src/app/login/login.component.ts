import {Component} from '@angular/core';
import {NgForm} from '@angular/forms';
import {SessionService} from '../provider/session.service';
import {User} from '../entities/user';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  users: User[];

  constructor(private router: Router, private session: SessionService) {
    this.users = session.getUsers();
  }

  onLogin(f: NgForm): void {
    if (!f.value.user) {
      return
    }
    if (this.session.setUserName(f.value.user)) {
      this.router.navigate(['']);
    }
  }
}
