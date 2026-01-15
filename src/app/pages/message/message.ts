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
  createMessageContent: string = '';
  sendMessageContent: string = '';
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
    if (!this.createMessageContent.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      content: this.createMessageContent.trim(),
      author: localStorage.getItem('userName') || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.messages.unshift(newMessage);
    this.saveMessages();
    this.createMessageContent = '';
    this.selectedMessage = null;
    this.isEditing = false;
  }

  selectMessage(message: Message) {
    this.selectedMessage = message;
    this.createMessageContent = message.content;
    this.isEditing = true;
  }

  updateMessage() {
    if (!this.selectedMessage || !this.createMessageContent.trim()) return;

    this.selectedMessage.content = this.createMessageContent.trim();
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
    this.createMessageContent = '';
    this.selectedMessage = null;
    this.isEditing = false;
  }

  sendMessage() {
    if (!this.sendMessageContent.trim()) return;

    // Send to admin by saving to shared localStorage
    const adminMessages = JSON.parse(localStorage.getItem('admin_messages') || '[]');
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || 'Anonymous';
    const userRole = localStorage.getItem('userRole') || 'user';

    const adminMessage = {
      id: Date.now(),
      content: this.sendMessageContent.trim(),
      sender: userEmail,
      senderName: userName,
      senderRole: userRole,
      timestamp: new Date().toISOString(),
      contactInfo: {
        email: userEmail,
        name: userName,
        role: userRole,
      },
    };

    adminMessages.unshift(adminMessage);
    localStorage.setItem('admin_messages', JSON.stringify(adminMessages));

    console.log('Message sent to admin:', this.sendMessageContent);
    alert('Message sent to Admin!');

    this.sendMessageContent = '';
  }

  goBack() {
    this.router.navigate(['/feed']);
  }
}
