import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login-user',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login-user.html',
  styleUrls: ['./login-user.css'],
})
export class LoginUserComponent {
  form: FormGroup;
  showPassword = false;
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      communityName: ['', Validators.required],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;
    const communityName = this.form.get('communityName')?.value;

    try {
      const result = await this.authService.loginUser(email, password, communityName);
      if (result.success) {
        this.router.navigate(['/feed']);
      } else {
        this.errorMessage = result.error || 'Invalid credentials. Please check your email, password, and community name.';
      }
    } catch (error) {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      console.error('Login error:', error);
    }

    this.isLoading = false;
  }

  goToRegister() {
    this.router.navigate(['/register-user']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  goToAdminLogin() {
    this.router.navigate(['/login-admin']);
  }

  goBack() {
    this.router.navigate(['/register-user']);
  }
}
