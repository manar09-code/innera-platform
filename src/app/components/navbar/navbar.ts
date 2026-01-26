import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent implements OnInit {
  userRole: string = '';
  userName: string = '';
  currentLang: string = 'en';

  constructor(private router: Router, private translationService: TranslationService) { }

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private authService: AuthService // ISSUE 9: Injected for reactive state
  ) { }

  async ngOnInit() {
    // Subscribe to reactive subjects to ensure UI updates instantly
    this.authService.userName$.subscribe((name: string) => this.userName = name);
    this.authService.userRole$.subscribe((role: string) => this.userRole = role);
>>>>>>> 59d1c747cfd3e0b2b2fb785bb483edb9835920f5

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || '';
    this.userName = localStorage.getItem('userName') || '';
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
