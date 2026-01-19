import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MessageService, Message } from '../../services/message.service';
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
    private messageService: MessageService
  ) { }

  ngOnInit() {
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

    try {
      await this.messageService.sendMessageToAdmin(this.createMessageContent.trim());
      this.createMessageContent = ''; // Clear input
      this.autoScrollBottom();
    } catch (error) {
      console.error("Error sending message to admin:", error);
    }
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
