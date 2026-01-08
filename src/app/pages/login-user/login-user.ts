import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-user.html',
  styleUrls: ['./login-user.css']
})
export class LoginUserComponent {
  form: FormGroup;
  showPassword = false;
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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

      if (email === 'user@innera.com' && password === 'user123') {
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userEmail', email);
        this.router.navigate(['/home']);
      } else {
        this.errorMessage = 'Invalid credentials. Try: user@innera.com / user123';
      }
      this.isLoading = false;
    }, 1000);
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
}
