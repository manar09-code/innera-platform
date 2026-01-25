import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  async canActivate(): Promise<boolean> {
    // ISSUE 4 FIX: Wait for Firebase Auth to initialize before checking status.
    // This prevents the application from redirecting to login on page refresh.
    await this.authService.isInitialized;

    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login-user']);
      return false;
    }
  }
}
