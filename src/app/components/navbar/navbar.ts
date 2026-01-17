import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit {
  userRole: string = '';
  userName: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || '';
    this.userName = localStorage.getItem('userName') || '';
  }

  
  navigateToProfile(): void {
    const userRole = localStorage.getItem('userRole') || '';
    if (userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  navigateToWritePost(): void {
    this.router.navigate(['/write-post']);
  }

  navigateToImagePost(): void {
    this.router.navigate(['/image-post']);
  }

  navigateToConfigAi(): void {
    this.router.navigate(['/config-ai']);
  }

  navigateToMessage(): void {
    this.router.navigate(['/message']);
  }
}
