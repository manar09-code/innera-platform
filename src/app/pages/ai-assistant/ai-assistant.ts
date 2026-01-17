import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { filter, Subscription } from 'rxjs';

interface Message {
  text: string;
  time: Date;
  isUser: boolean;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrls: ['./ai-assistant.css'],
})
export class AiAssistantComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @Input() currentPage: string = '';
  @Input() userRole: string = '';

  isOpen = false;
  isLoading = false;
  userMessage = '';
  messages: Message[] = [];
  private routerSubscription?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || '';
    this.currentPage = this.router.url.split('/')[1] || 'home';
    // Update currentPage when route changes
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentPage = this.router.url.split('/')[1] || 'home';
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  async sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return;

    const message = this.userMessage.trim();
    this.userMessage = '';
    this.isLoading = true;

    // Add user message
    this.messages.push({
      text: message,
      time: new Date(),
      isUser: true,
    });

    try {
      const functions = getFunctions();
      const aiChat = httpsCallable(functions, 'aiChat');
      const userEmail = localStorage.getItem('userEmail') || '';
      
      // Load AI instructions and community info from localStorage
      const aiInstructions = localStorage.getItem('aiInstructions') || '';
      const communityInfoStr = localStorage.getItem('communityInfo');
      let communityInfo = null;
      if (communityInfoStr) {
        try {
          communityInfo = JSON.parse(communityInfoStr);
        } catch (e) {
          console.error('Error parsing community info:', e);
        }
      }
      
      const result = await aiChat({
        message,
        context: {
          page: this.currentPage,
          role: this.userRole,
          userEmail: userEmail,
          aiInstructions: aiInstructions,
          communityInfo: communityInfo,
        },
      });

      // Add AI response
      this.messages.push({
        text: (result.data as { reply: string }).reply || 'Sorry, I could not generate a response.',
        time: new Date(),
        isUser: false,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      this.messages.push({
        text: 'Sorry, I am unable to respond right now. Please try again later.',
        time: new Date(),
        isUser: false,
      });
    } finally {
      this.isLoading = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
