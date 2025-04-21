import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '@shigde/core';
import {catchError, of, take} from 'rxjs';
import {NgClass, NgIf} from '@angular/common';
import {map} from 'rxjs/operators';
import {ValidInput} from '../../../validators/valid-types';
import {AlertService} from '../../../providers/alert.service';
import {AlertKind} from '../../../entities/alert';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf
  ],
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  public emailValid: ValidInput = '';
  public passValid: ValidInput = '';

  public fail: boolean = false;
  protected loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  constructor(
    private readonly authService: AuthService,
    private readonly alert: AlertService) {
  }

  onSubmit() {
    this.fail = false;
    this.emailValid = this.loginForm.get('email')?.invalid ? 'is-invalid' : 'is-valid';
    this.passValid = this.loginForm.get('password')?.invalid ? 'is-invalid' : 'is-valid';
    if (this.loginForm.valid) {
      this.authService.login(`${this.loginForm.value.email}`, `${this.loginForm.value.password}`).pipe(
        take(1),
        map(_ => window.location.href = '/dashboard'),
        catchError(_ => this.handleError())
      ).subscribe();
    } else {
      this.loginForm.get('email')?.markAsTouched({onlySelf: true});
      this.loginForm.get('password')?.markAsTouched({onlySelf: true});
    }
  }

  private handleError() {
    this.alert.alert(AlertKind.DANGER, 'Login fails')
    this.fail = true;
    return of('');
  }

  public emailClean() {
    this.emailValid = '';
  }

  public passClean() {
    this.passValid = '';
  }
}
