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
  selector: 'app-register-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-user.html',
  styleUrls: ['./register-user.css'],
})
export class RegisterUserComponent {
  form: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group(
      {
        username: ['', Validators.required],
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

  async register() {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const username = this.form.get('username')?.value;
    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;
    const communityName = this.form.get('communityName')?.value;

    try {
      const result = await this.authService.registerUser(username, email, password, communityName);
      if (result.success) {
        this.successMessage = 'User account created! Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/feed']);
        }, 2000);
      } else {
        this.errorMessage = result.error || 'Registration failed. Please try again.';
      }
    } catch (error) {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      console.error('Registration error:', error);
    }

    this.isLoading = false;
  }

  goToLogin() {
    this.router.navigate(['/login-user']);
  }

  goBack() {
    this.router.navigate(['/login-user']);
  }
}
