import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit {
  userRole: string = '';
  userName: string = '';
  currentLang: string = 'en';

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    // Subscribe to reactive subjects to ensure UI updates instantly
    this.authService.userName$.subscribe((name: string) => this.userName = name);
    this.authService.userRole$.subscribe((role: string) => this.userRole = role);
    this.currentLang = this.translationService.getLanguage();
  }

  toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'fr' : 'en';
    this.translationService.setLanguage(newLang);
    this.currentLang = newLang;
    // Reload to apply changes if strictly necessary or rely on pipe purity (impure pipe used)
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

  navigateToAdminMessages(): void {
    this.router.navigate(['/admin-message']);
  }
}
