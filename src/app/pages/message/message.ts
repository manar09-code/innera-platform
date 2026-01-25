import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MessageService, Message } from '../../services/message.service';
import { WebhookService } from '../../services/webhook.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './message.html',
  styleUrls: ['./message.css'],
})
export class MessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  createMessageContent: string = '';
  private unsubscribe: (() => void) | null = null;
  currentUserEmail: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private webhookService: WebhookService
  ) { }

  async ngOnInit() {
    // ISSUE 10 FIX: Wait for AuthService to restore profile from Firestore
    await this.authService.isInitialized;

    this.currentUserEmail = localStorage.getItem('userEmail') || '';
    if (this.currentUserEmail) {
      // Listen to conversation (conversationId = userId)
      this.unsubscribe = this.messageService.listenToConversation(this.currentUserEmail, (msgs) => {
        this.messages = msgs;
        this.autoScrollBottom();
      });
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  async sendMessage() {
    if (!this.createMessageContent.trim()) return;

    const user = this.authService.getCurrentUser();
    if (!user || !user.email) {
      console.error('No user logged in');
      return;
    }

    const messageText = this.createMessageContent.trim();
    const adminEmail = 'admin@innera-platform.com';
    const adminName = 'Community Admin';

    try {
      // 1. Save to Firebase Firestore
      await this.messageService.sendMessageToAdmin(messageText);

      // 2. Show UI success
      this.showToast('✅ Message sent to admin!');

      // ISSUE 1 FIX: Capture content for notification BEFORE clearing it
      const contentToNotify = messageText;

      // 3. Clear input
      this.createMessageContent = '';

      // 4. Send Make AI webhook (non-blocking)
      this.sendMessageNotification(contentToNotify);

    } catch (error) {
      this.showError('Failed to send message');
    }
  }

  private async sendMessageNotification(messageText: string) {
    try {
      const user = this.authService.getCurrentUser();
      if (!user || !user.email) return;

      // ISSUE 1: Get community context for notifications
      const communityName = this.authService.getCommunityName() || 'Unknown';

      // Use the passed messageText instead of reading from cleared component state

      // Send to USER (confirmation)
      await this.webhookService.triggerMessageSent(
        user.email,
        user.displayName || user.email.split('@')[0],
        user.uid,
        'admin@innera-platform.com',
        'Community Admin',
        messageText,
        communityName
      );

      // Send to ADMIN (alert)
      await this.webhookService.triggerMessageReceived(
        user.email,
        user.displayName || user.email.split('@')[0],
        user.uid,
        'admin@innera-platform.com',
        'Community Admin',
        messageText,
        communityName
      );

    } catch (error) {
      console.warn('Email notification failed:', error);
    }
  }

  private showToast(message: string) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: green;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }

  private showError(message: string) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: red;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }

  autoScrollBottom() {
    setTimeout(() => {
      const container = document.querySelector('.messages-list');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  goBack() {
    this.router.navigate(['/feed']);
  }
}
