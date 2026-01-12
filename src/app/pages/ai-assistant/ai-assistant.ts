import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrls: ['./ai-assistant.css'],
})
export class AiAssistantComponent implements OnInit {
  messages: Message[] = [
    {
      id: 1,
      text: "Hello! I'm your AI Assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ];
  newMessageText: string = '';
  messageIdCounter: number = 2;
  communityName: string = '';
  userName: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.communityName = this.authService.getCommunityName() || 'Innera Platform';
    this.userName = localStorage.getItem('userName') || '';
  }

  sendMessage(): void {
    const text = this.newMessageText.trim();
    if (text) {
      // Add user message
      const userMessage: Message = {
        id: this.messageIdCounter++,
        text: text,
        sender: 'user',
        timestamp: new Date(),
      };
      this.messages.push(userMessage);
      this.newMessageText = '';

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = this.generateMockResponse(text);
        const aiMessage: Message = {
          id: this.messageIdCounter++,
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };
        this.messages.push(aiMessage);
      }, 1000); // Delay for realism
    }
  }

  private generateMockResponse(userMessage: string): string {
    const instructions = localStorage.getItem('aiInstructions');
    const lowerMessage = userMessage.toLowerCase();

    // Personalized greeting with community info
    const greeting = this.userName ? `Hi ${this.userName}! ` : 'Hello! ';

    // If custom instructions are set, use them to generate a response
    if (instructions) {
      // Simple logic to incorporate instructions - in a real app, this would be more sophisticated
      if (lowerMessage.includes('community') && lowerMessage.includes('info')) {
        return `${greeting}${instructions} Welcome to ${this.communityName}! Our community is focused on connecting people with shared interests in Tunisian culture, food, and travel. We have over 500 active members!`;
      } else if (lowerMessage.includes('update') || lowerMessage.includes('news')) {
        return `${greeting}${instructions} Recent updates in ${this.communityName}: New trending hashtags include #TunisianCulture and #Hammamet. Check out the latest posts in the feed!`;
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return `${greeting}${instructions} What would you like to know about ${this.communityName}?`;
      } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return `${greeting}${instructions} I can help you with: • Community information • Recent updates and news • Navigation tips • Answering questions about ${this.communityName}`;
      } else if (lowerMessage.includes('profile') || lowerMessage.includes('account')) {
        return `${greeting}${instructions} You can manage your profile by clicking on your profile picture or the Profile link in the navigation menu.`;
      } else if (lowerMessage.includes('post') || lowerMessage.includes('write')) {
        return `${greeting}${instructions} To create a new post, use the Write Post or Image Post options in the navigation menu.`;
      } else {
        return `${greeting}${instructions} I'm here to help with information about ${this.communityName}. Try asking about our community, recent updates, or how to navigate the platform!`;
      }
    } else {
      // Default responses if no instructions are set
      if (lowerMessage.includes('community') && lowerMessage.includes('info')) {
        return `${greeting}Welcome to ${this.communityName}! Our community is focused on connecting people with shared interests in Tunisian culture, food, and travel. We have over 500 active members!`;
      } else if (lowerMessage.includes('update') || lowerMessage.includes('news')) {
        return `${greeting}Recent updates in ${this.communityName}: New trending hashtags include #TunisianCulture and #Hammamet. Check out the latest posts in the feed!`;
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return `${greeting}What would you like to know about ${this.communityName}?`;
      } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return `${greeting}I can help you with: • Community information • Recent updates and news • Navigation tips • Answering questions about ${this.communityName}`;
      } else if (lowerMessage.includes('profile') || lowerMessage.includes('account')) {
        return `${greeting}You can manage your profile by clicking on your profile picture or the Profile link in the navigation menu.`;
      } else if (lowerMessage.includes('post') || lowerMessage.includes('write')) {
        return `${greeting}To create a new post, use the Write Post or Image Post options in the navigation menu.`;
      } else {
        return `${greeting}I'm here to help with information about ${this.communityName}. Try asking about our community, recent updates, or how to navigate the platform!`;
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/feed']);
  }
}
