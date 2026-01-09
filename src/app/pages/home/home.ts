import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  userRole: string | null = '';
  userEmail: string | null = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole');
    this.userEmail = localStorage.getItem('userEmail');

    if (!this.userRole) {
      this.router.navigate(['/login-admin']);
    }
  }

  goToFeed() {
    this.router.navigate(['/feed']);
  }

  logout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    this.router.navigate(['/login-admin']);
  }

  goToUserRegister() {
    this.router.navigate(['/register-user']);
  }
  goToAdminRegister() {
    this.router.navigate(['/register-admin']);}}