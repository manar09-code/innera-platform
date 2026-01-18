import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { collection, addDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase.config';

interface Message {
  id: string;
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

  async loadConversations() {
    try {
      const messagesRef = collection(firestore, 'adminMessages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const userConversations: { [key: string]: Conversation } = {};

      querySnapshot.forEach((doc) => {
        const msg = doc.data() as any;
        const sender = msg['userEmail'];

        if (!userConversations[sender]) {
          userConversations[sender] = {
            userEmail: sender,
            userName: msg['userName'] || sender,
            messages: [],
            lastMessage: '',
            lastTimestamp: '',
          };
        }

        const message: Message = {
          id: doc.id,
          content: msg['content'],
          sender: sender,
          timestamp: msg['timestamp'].toDate().toISOString(),
        };

        userConversations[sender].messages.unshift(message);
        if (!userConversations[sender].lastMessage) {
          userConversations[sender].lastMessage = msg['content'];
          userConversations[sender].lastTimestamp = message.timestamp;
        }
      });

      this.conversations = Object.values(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback to localStorage if Firestore fails
      this.loadConversationsFromLocalStorage();
    }
  }

  loadConversationsFromLocalStorage() {
    // Load real user messages from localStorage
    const adminMessages = JSON.parse(localStorage.getItem('admin_messages') || '[]');

    // Group messages by user
    const userConversations: { [key: string]: Conversation } = {};

    adminMessages.forEach((msg: any) => {
      if (!userConversations[msg.sender]) {
        userConversations[msg.sender] = {
          userEmail: msg.sender,
          userName: msg.senderName,
          messages: [],
          lastMessage: '',
          lastTimestamp: '',
        };
      }
      userConversations[msg.sender].messages.push({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
      });
      userConversations[msg.sender].lastMessage = msg.content;
      userConversations[msg.sender].lastTimestamp = msg.timestamp;
    });

    this.conversations = Object.values(userConversations);
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
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
