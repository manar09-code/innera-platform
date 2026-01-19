import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { AuthService } from './auth.service';

export interface Message {
    id?: string;
    content: string;
    senderId: string;
    senderName: string;
    senderRole: string; // 'user' | 'admin'
    receiverId: string; // 'admin' for user->admin, or userId for admin->user
    conversationId: string; // Usually userId for 1:1 with admin
    createdAt: Timestamp;
}

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    constructor(private authService: AuthService) { }

    async sendMessageToAdmin(content: string): Promise<void> {
        let user: any = this.authService.getCurrentUser();

        // Fallback to localStorage if state lost on reload
        if (!user) {
            const email = localStorage.getItem('userEmail');
            if (email) {
                user = { email: email };
            } else {
                alert("Please log in to send messages.");
                throw new Error("User not logged in");
            }
        }

        const userName = localStorage.getItem('userName') || 'User';

        const message: any = {
            content,
            senderId: user.email,
            senderName: userName,
            senderRole: 'user',
            receiverId: 'admin',
            conversationId: user.email,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(firestore, 'messages'), message);

        // Automation Hook: Send email
        this.triggerAutomation('sendMessage', {
            email: user.email,
            message: content
        });
    }

    async sendReplyToUser(userId: string, content: string): Promise<void> {
        const message: any = {
            content,
            senderId: 'admin', // admin ID
            senderName: 'Admin',
            senderRole: 'admin',
            receiverId: userId,
            conversationId: userId,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(firestore, 'messages'), message);
    }

    listenToConversation(conversationId: string, callback: (messages: Message[]) => void): () => void {
        const q = query(
            collection(firestore, 'messages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            callback(messages);
        });
    }

    listenToAllMessages(callback: (messages: Message[]) => void): () => void {
        const q = query(
            collection(firestore, 'messages'),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            callback(messages);
        });
    }

    // PASTE YOUR MAKE.COM WEBHOOK URL HERE
    private automationWebhookUrl = '';

    private triggerAutomation(event: string, data: any) {
        console.log(`[Automation Triggered] Event: ${event}, Data:`, data);

        // 1. Simulation for User Feedback
        if (event === 'sendMessage') {
            const email = data.email || 'user';
            const msg = `[AUTOMATION SIMULATION]\n\nSuccess! An email would be sent to ${email} confirming receipt of their message.\n\n(See console for Webhook setup instructions if not configured)`;
            alert(msg);
        }

        // 2. Real Integration with Make.com
        if (this.automationWebhookUrl) {
            fetch(this.automationWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, ...data })
            }).catch(err => console.error('Automation Webhook Error:', err));
        } else {
            console.warn('Automation Webhook URL not set. To enable real email automation, paste your Make.com webhook URL into MessageService.automationWebhookUrl.');
        }
    }
}
