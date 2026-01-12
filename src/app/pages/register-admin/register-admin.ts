import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-admin.html',
  styleUrls: ['./register-admin.css'],
})
export class RegisterAdminComponent {
goBack() {
throw new Error('Method not implemented.');
}
  form: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group(
      {
        adminName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        communityName: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all fields correctly';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      const adminName = this.form.get('adminName')?.value;
      const email = this.form.get('email')?.value;
      const password = this.form.get('password')?.value;
      const communityName = this.form.get('communityName')?.value;

      const success = this.authService.registerAdmin(adminName, email, password, communityName);
      if (success) {
        this.successMessage = 'Admin account created! Redirecting to login...';
        this.errorMessage = '';
        setTimeout(() => {
          this.router.navigate(['/login-admin']);
        }, 2000);
      } else {
        this.errorMessage = 'Email already exists. Please use a different email.';
        this.successMessage = '';
      }

      this.isLoading = false;
    }, 1000);
  }

  goToLogin() {
    this.router.navigate(['/login-admin']);
  }
}
