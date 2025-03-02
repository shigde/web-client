import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '@shigde/core';
import {catchError, of, take, tap} from 'rxjs';
import {NgClass, NgIf} from '@angular/common';
import {PASSWORD_CONSTRAIN, PasswordValidator} from '../../../validators/password.validator';
import {ValidInput} from '../../../validators/valid-types';

@Component({
    selector: 'app-signup',
    imports: [
        ReactiveFormsModule,
        NgIf,
        NgClass
    ],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {

  public success = false;
  public fail = false;

  public userValid: ValidInput = '';
  public emailValid: ValidInput = '';
  public passwordValid: ValidInput = '';
  public confirmPassValid: ValidInput = '';
  public termsValid: ValidInput = '';


  public signupForm = new FormGroup({
    user: new FormControl('', [Validators.min(4), Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
        Validators.required,
        Validators.pattern(PASSWORD_CONSTRAIN),
        PasswordValidator.uppercaseLetter,
        PasswordValidator.lowercaseLetter,
        PasswordValidator.digit,
        PasswordValidator.specialCharacter,
        PasswordValidator.minLength
      ]
    ),
    confirmPassword: new FormControl('', [Validators.required]),
    terms: new FormControl('', [Validators.requiredTrue]),
  }, {validators: [PasswordValidator.confirm('confirmPassword', 'password')]});

  constructor(private readonly authService: AuthService, private readonly router: Router) {
  }

  public onSubmit() {
    if (this.signupForm.valid) {

      const name = `${this.signupForm.value.user}`;
      const email = `${this.signupForm.value.email}`;
      const pass = `${this.signupForm.value.password}`;
      const account = {name, email, pass};

      this.authService.registerAccount(account).pipe(
        take(1),
        tap(_ => this.success = true),
        catchError((_) => this.handleError())
      ).subscribe();
    } else {
      this.signupForm.get('user')?.markAsTouched({onlySelf: true});
      this.signupForm.get('email')?.markAsTouched({onlySelf: true});
      this.signupForm.get('password')?.markAsTouched({onlySelf: true});
      this.signupForm.get('terms')?.markAsTouched({onlySelf: true});
      this.signupForm.get('confirmPassword')?.markAsTouched({onlySelf: true});
      this.onChangeUser();
      this.onChangeEmail();
      this.onChangePassword();
      this.onChangeConfirmPass();
      this.onChangeTerms();
    }
  }

  private handleError() {
    this.fail = true;
    return of('');
  }

  public onChangeUser() {
    if (this.signupForm.get('user')?.invalid && (this.signupForm.get('user')?.dirty || this.signupForm.get('user')?.touched)) {
      this.userValid = 'is-invalid';
      return
    }
    if (this.signupForm.get('user')?.valid) {
      this.userValid = 'is-valid';
    }
  }

  public onChangeEmail() {
    if (this.signupForm.get('email')?.invalid) {
      this.emailValid = 'is-invalid';
      return
    }
    if (this.signupForm.get('email')?.valid) {
      this.emailValid = 'is-valid';
    }
  }

  onChangePassword() {
    if (this.signupForm.get('password')?.invalid) {
      this.passwordValid = 'is-invalid';
      return
    }
    if (this.signupForm.get('password')?.valid) {
      this.passwordValid = 'is-valid';
    }
  }

  onChangeConfirmPass() {
    if (this.signupForm.get('confirmPassword')?.invalid || this.signupForm.errors?.['confirm']) {
      this.confirmPassValid = 'is-invalid';
      return
    }
    if (this.signupForm.get('confirmPassword')?.valid) {
      this.confirmPassValid = 'is-valid';
    }
  }

  public onChangeTerms() {
    if (this.signupForm.get('terms')?.invalid) {
      this.termsValid = 'is-invalid';
      return
    }
    if (this.signupForm.get('terms')?.valid) {
      this.termsValid = 'is-valid';
    }
  }
}
