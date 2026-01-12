import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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

  login() {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill in all fields correctly';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      const email = this.form.get('email')?.value;
      const password = this.form.get('password')?.value;
      const communityName = this.form.get('communityName')?.value;

      const success = this.authService.loginAdmin(email, password, communityName);
      if (success) {
        this.errorMessage = '';
        this.router.navigate(['/feed']);
      } else {
        this.errorMessage =
          'Invalid credentials. Please check your email, password, and community name.';
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

  goBack() {
    this.router.navigate(['/register-admin']);
  }
}
