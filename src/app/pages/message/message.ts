import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Message {
  id: number;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.html',
  styleUrls: ['./message.css'],
})
export class MessageComponent implements OnInit {
  messages: Message[] = [];
  lastSentMessages: Message[] = [];
  selectedMessage: Message | null = null;
  messageContent: string = '';
  isEditing: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    const userEmail = localStorage.getItem('userEmail') || '';
    const storedMessages = localStorage.getItem(`messages_${userEmail}`);
    if (storedMessages) {
      this.messages = JSON.parse(storedMessages);
    }
    // Mock last sent messages (in real app, fetch from backend)
    this.lastSentMessages = this.messages.slice(-5); // Last 5 messages
  }

  saveMessages() {
    const userEmail = localStorage.getItem('userEmail') || '';
    localStorage.setItem(`messages_${userEmail}`, JSON.stringify(this.messages));
  }

  createMessage() {
    if (!this.messageContent.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      content: this.messageContent.trim(),
      author: localStorage.getItem('userName') || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.messages.unshift(newMessage);
    this.saveMessages();
    this.messageContent = '';
    this.selectedMessage = null;
    this.isEditing = false;
  }

  selectMessage(message: Message) {
    this.selectedMessage = message;
    this.messageContent = message.content;
    this.isEditing = true;
  }

  updateMessage() {
    if (!this.selectedMessage || !this.messageContent.trim()) return;

    this.selectedMessage.content = this.messageContent.trim();
    this.selectedMessage.updatedAt = new Date().toISOString();
    this.saveMessages();
    this.cancelEdit();
  }

  deleteMessage() {
    if (!this.selectedMessage) return;

    this.messages = this.messages.filter((m) => m.id !== this.selectedMessage!.id);
    this.saveMessages();
    this.cancelEdit();
  }

  cancelEdit() {
    this.messageContent = '';
    this.selectedMessage = null;
    this.isEditing = false;
  }

  sendMessage() {
    if (!this.messageContent.trim()) return;

    // In real app, send to admin via service
    console.log('Sending message to admin:', this.messageContent);
    alert('Message sent to Admin!');

    // Add to messages list
    const newMessage: Message = {
      id: Date.now(),
      content: this.messageContent.trim(),
      author: localStorage.getItem('userName') || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.messages.unshift(newMessage);
    this.saveMessages();
    this.lastSentMessages = this.messages.slice(-5);
    this.messageContent = '';
  }

  goBack() {
    this.router.navigate(['/feed']);
  }
}
