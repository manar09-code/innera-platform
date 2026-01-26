import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Message } from '../../services/message.service'; // Import service
import { AuthService } from '../../services/auth.service'; // ISSUE 1 FIX: Direct import for injection
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
  private communitySubscription: any;

  constructor(
    private router: Router,
    private messageService: MessageService,
    public authService: AuthService // ISSUE 1 FIX: Public for template access
  ) { }

  ngOnInit() {
    this.loadConversations();
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.communitySubscription) this.communitySubscription.unsubscribe();
  }

  loadConversations() {
    // ISSUE 1 & 5 FIX: Reactive community subscription
    // Subscribe to reactive subjects to ensure UI updates instantly
    // This ensures that even if AuthService takes a moment to load the profile,
    // the UI will update as soon as the community name resolved.
    this.communitySubscription = this.authService.communityName$.subscribe((community) => {
      if (!community) {
        console.log('[AdminMessage] Waiting for community name to resolve...');
        return;
      }

      console.log('[AdminMessage] Resolved community for filtering:', community);

      // Clean up previous listener if it exists
      if (this.unsubscribe) this.unsubscribe();

      this.unsubscribe = this.messageService.listenToMessagesForCommunity(community, (messages) => {
        console.log('[AdminMessage] Received messages for community:', messages.length);
        const grouped: { [key: string]: Conversation } = {};

        // ISSUE 3 & 6: Robust community filtering
        const robustNormalize = (n: string) => (n || '').toLowerCase().trim().replace(/[-_]/g, ' ');
        const targetComm = robustNormalize(community);
        console.log('[AdminMessage] Filtering for community:', `"${targetComm}"`);

        const filteredMessages = messages.filter(msg => {
          const msgComm = robustNormalize(msg.communityName);
          const isMatch = msgComm === targetComm || !msgComm; // LEGACY SAFETY: Allow empty communityName

          if (!isMatch) {
            console.log(`[AdminMessage] Message Hidden: Content="${msg.content.substring(0, 15)}..." FromComm="${msgComm}"`);
          }
          return isMatch;
        });

        console.log('[AdminMessage] Filter Result:', {
          total: messages.length,
          visible: filteredMessages.length,
          target: targetComm
        });

        console.log('[AdminMessage] Filtered messages count:', filteredMessages.length);

        filteredMessages.forEach(msg => {
          // Determine conversation key (user email)
          const convKey = msg.conversationId || 'unknown';

          if (!grouped[convKey]) {
            grouped[convKey] = {
              userEmail: convKey,
              userName: msg.senderRole === 'user' ? msg.senderName : 'User',
              messages: [],
              lastMessage: '',
              lastTimestamp: null
            };
          }

          // Update username if we find a user message (in case first msg was admin)
          if (msg.senderRole === 'user' && msg.senderName) {
            grouped[convKey].userName = msg.senderName;
          }

          grouped[convKey].messages.push(msg);

          // Sort messages asc for display - Safe handling for null server timestamps
          grouped[convKey].messages.sort((a: any, b: any) => {
            const timeA = a.createdAt?.toMillis() || Date.now();
            const timeB = b.createdAt?.toMillis() || Date.now();
            return timeA - timeB;
          });

          // Last message info
          const lastMsg = grouped[convKey].messages[grouped[convKey].messages.length - 1];
          grouped[convKey].lastMessage = lastMsg.content;
          grouped[convKey].lastTimestamp = lastMsg.createdAt;
        });

        // Show all conversations
        this.conversations = Object.values(grouped)
          .sort((a: any, b: any) => {
            const timeA = a.lastTimestamp?.toMillis() || 0;
            const timeB = b.lastTimestamp?.toMillis() || 0;
            return timeB - timeA;
          });

        // Re-select conversation if active
        if (this.selectedConversation) {
          const updated = this.conversations.find(c => c.userEmail === this.selectedConversation!.userEmail);
          if (updated) {
            this.selectedConversation = updated;
            this.autoScrollBottom();
          }
        }
      });
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
