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

    // Simulate AI response with basic answers
    setTimeout(() => {
      let response = 'I\'m sorry, I don\'t have an answer for that right now.';

      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = 'Hello! How can I help you today?';
      } else if (lowerMessage.includes('how are you')) {
        response = 'I\'m doing well, thank you for asking! How about you?';
      } else if (lowerMessage.includes('what is your name') || lowerMessage.includes('who are you')) {
        response = 'I am the AI Assistant for the Innera Platform. I\'m here to help with basic questions.';
      } else if (lowerMessage.includes('time') || lowerMessage.includes('date')) {
        response = `The current time is ${new Date().toLocaleString()}.`;
      } else if (lowerMessage.includes('help')) {
        response = 'I can answer basic questions about the platform, time, and general inquiries. What would you like to know?';
      } else if (lowerMessage.includes('thank you') || lowerMessage.includes('thanks')) {
        response = 'You\'re welcome! Is there anything else I can assist you with?';
      }

      // Add AI response
      this.messages.push({
        text: response,
        time: new Date(),
        isUser: false,
      });

      this.isLoading = false;
    }, 1000); // Simulate 1 second delay
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
