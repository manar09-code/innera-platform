import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  id: number;
  content: string;
  sender: string; // 'admin' or user email
  timestamp: string;
}

interface Conversation {
  userEmail: string;
  userName: string;
  messages: Message[];
  lastMessage: string;
  lastTimestamp: string;
}

@Component({
  selector: 'app-admin-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-message.html',
  styleUrls: ['./admin-message.css'],
})
export class AdminMessageComponent implements OnInit {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  newMessage: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    // Mock conversations - in real app, fetch from backend
    const mockConversations: Conversation[] = [
      {
        userEmail: 'user1@example.com',
        userName: 'User One',
        messages: [
          {
            id: 1,
            content: 'Hello Admin, I have a question.',
            sender: 'user1@example.com',
            timestamp: '2023-10-01T10:00:00Z',
          },
          {
            id: 2,
            content: 'Sure, how can I help?',
            sender: 'admin',
            timestamp: '2023-10-01T10:05:00Z',
          },
          {
            id: 3,
            content: 'About the new feature.',
            sender: 'user1@example.com',
            timestamp: '2023-10-01T10:10:00Z',
          },
        ],
        lastMessage: 'About the new feature.',
        lastTimestamp: '2023-10-01T10:10:00Z',
      },
      {
        userEmail: 'user2@example.com',
        userName: 'User Two',
        messages: [
          {
            id: 4,
            content: 'Issue with login.',
            sender: 'user2@example.com',
            timestamp: '2023-10-02T11:00:00Z',
          },
          {
            id: 5,
            content: 'Please provide more details.',
            sender: 'admin',
            timestamp: '2023-10-02T11:15:00Z',
          },
        ],
        lastMessage: 'Please provide more details.',
        lastTimestamp: '2023-10-02T11:15:00Z',
      },
    ];
    this.conversations = mockConversations;
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    const message: Message = {
      id: Date.now(),
      content: this.newMessage.trim(),
      sender: 'admin',
      timestamp: new Date().toISOString(),
    };

    this.selectedConversation.messages.push(message);
    this.selectedConversation.lastMessage = message.content;
    this.selectedConversation.lastTimestamp = message.timestamp;
    this.newMessage = '';

    // In real app, send to backend
    console.log('Admin reply sent:', message);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
