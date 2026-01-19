import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Message } from '../../services/message.service'; // Import service
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Conversation {
  userEmail: string;
  userName: string;
  messages: Message[];
  lastMessage: string;
  lastTimestamp: any;
}

@Component({
  selector: 'app-admin-message',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-message.html',
  styleUrls: ['./admin-message.css'],
})
export class AdminMessageComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  newMessage: string = '';
  private unsubscribe: (() => void) | null = null;

  constructor(private router: Router, private messageService: MessageService) { }

  ngOnInit() {
    this.loadConversations();
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  loadConversations() {
    this.unsubscribe = this.messageService.listenToAllMessages((messages) => {
      const grouped: { [key: string]: Conversation } = {};

      messages.forEach(msg => {
        // Determine conversation key (user email)
        const convKey = msg.conversationId;

        if (!grouped[convKey]) {
          grouped[convKey] = {
            userEmail: convKey,
            userName: msg.senderRole === 'user' ? msg.senderName : 'User',
            messages: [],
            lastMessage: '',
            lastTimestamp: 0
          };
        }

        // Update username if we find a user message (in case first msg was admin)
        if (msg.senderRole === 'user') {
          grouped[convKey].userName = msg.senderName;
        }

        grouped[convKey].messages.push(msg); // already sorted desc by query, but let's re-sort if needed

        // Sort messages asc for display
        grouped[convKey].messages.sort((a: any, b: any) => a.createdAt?.toMillis() - b.createdAt?.toMillis());

        // Last message info (since iteration order might vary or query order, let's pick last from sorted)
        const lastMsg = grouped[convKey].messages[grouped[convKey].messages.length - 1];
        grouped[convKey].lastMessage = lastMsg.content;
        grouped[convKey].lastTimestamp = lastMsg.createdAt;
      });

      this.conversations = Object.values(grouped).sort((a: any, b: any) => b.lastTimestamp?.toMillis() - a.lastTimestamp?.toMillis());

      // Re-select conversation if active
      if (this.selectedConversation) {
        const updated = this.conversations.find(c => c.userEmail === this.selectedConversation!.userEmail);
        if (updated) {
          this.selectedConversation = updated;
          this.autoScrollBottom();
        }
      }
    });
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    this.autoScrollBottom();
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    try {
      await this.messageService.sendReplyToUser(this.selectedConversation.userEmail, this.newMessage.trim());
      this.newMessage = '';
      this.autoScrollBottom();
    } catch (e) {
      console.error("Error sending reply", e);
    }
  }

  autoScrollBottom() {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  goBack() {
    this.router.navigate(['/feed']); // Or dashboard
  }
}
