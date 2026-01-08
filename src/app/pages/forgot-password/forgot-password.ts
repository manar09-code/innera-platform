import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.errorMessage = 'Please enter a valid email';
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      const email = this.form.get('email')?.value;
      this.successMessage = `Reset link sent to ${email}. Check your email!`;
      this.errorMessage = '';

      setTimeout(() => {
        this.router.navigate(['/reset-password']);
      }, 2000);

      this.isLoading = false;
    }, 1000);
  }

  goToLogin() {
    this.router.navigate(['/login-admin']);
  }
}
