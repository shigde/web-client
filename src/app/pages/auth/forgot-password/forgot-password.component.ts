import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '@shigde/core';
import {NgClass, NgIf} from '@angular/common';
import {catchError, of, take, tap} from 'rxjs';
import {PASSWORD_CONSTRAIN, PasswordValidator} from '../../../validators/password.validator';
import {ValidInput} from '../../../validators/valid-types';

@Component({
  selector: 'app-password-forgotten',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgClass
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {

  public fail = false;
  public success = false;
  private token: string | undefined;

  public newPassValid: ValidInput = '';
  public confirmPassValid: ValidInput = '';

  protected passForgetForm = new FormGroup({
    newPassword: new FormControl('', [
      Validators.required,
      Validators.pattern(PASSWORD_CONSTRAIN),
      PasswordValidator.uppercaseLetter,
      PasswordValidator.lowercaseLetter,
      PasswordValidator.digit,
      PasswordValidator.specialCharacter,
      PasswordValidator.minLength]),
    confirmPassword: new FormControl('', [Validators.required]),
  }, {validators: [PasswordValidator.confirm('confirmPassword', 'newPassword')]});

  constructor(private router: Router, private readonly route: ActivatedRoute, private authService: AuthService) {
  }

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (token === null) {
      this.fail = true;
      return;
    }

    this.token = token;
  }

  onSubmit() {
    this.success = false;
    if (this.passForgetForm.valid && this.token !== undefined) {
      const newPass = `${this.passForgetForm.value.newPassword}`;
      this.authService.updateForgotPassword(newPass, this.token).pipe(
        take(1),
        tap(a => this.success = true),
        catchError((_) => this.handleError())
      ).subscribe();
    } else {
      this.passForgetForm.get('confirmPassword')?.markAsTouched({onlySelf: true});
      this.passForgetForm.get('newPassword')?.markAsTouched({onlySelf: true});
    }
  }

  private handleError() {
    this.fail = true;
    return of('');
  }

  onChangeNewPass() {
    if (this.passForgetForm.get('newPassword')?.invalid) {
      this.newPassValid = 'is-invalid';
      return
    }
    if (this.passForgetForm.get('newPassword')?.valid) {
      this.newPassValid = 'is-valid';
    }
  }

  onChangeConfirmPass() {
    if (this.passForgetForm.get('confirmPassword')?.invalid || this.passForgetForm.errors?.['confirm']) {
      this.confirmPassValid = 'is-invalid';
      return
    }
    if (this.passForgetForm.get('confirmPassword')?.valid) {
      this.confirmPassValid = 'is-valid';
    }
  }
}
