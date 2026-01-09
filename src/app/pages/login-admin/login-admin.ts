import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-admin.html',
  styleUrls: ['./login-admin.css'],
})
export class LoginAdminComponent {
  form: FormGroup;
  showPassword = false;
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all fields correctly';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      const email = this.form.get('email')?.value;
      const password = this.form.get('password')?.value;

      if (email === 'admin@innera.com' && password === 'admin123') {
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', email);
        this.router.navigate(['/feed']);
      } else {
        this.errorMessage = 'Invalid credentials. Try: admin@innera.com / admin123';
      }
      this.isLoading = false;
    }, 1000);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  goToRegister() {
    this.router.navigate(['/register-admin']);
  }

  goToUserLogin() {
    this.router.navigate(['/login-user']);
  }
}
