import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { AuthService } from './auth.service';
import { WebhookService } from './webhook.service';
import { environment } from '../../environments/environment';

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

    constructor(private authService: AuthService, private webhookService: WebhookService) {
        // this.testMessagesIndex();
    }

    testMessagesIndex() {
        console.log('[CRITICAL DEBUG] Testing messages index...');

        // Test without ordering
        const qSimple = query(collection(firestore, 'messages'), where('conversationId', '==', 'test'));
        getDocs(qSimple)
            .then(snap => console.log('[DEBUG] Simple query:', snap.size, 'docs'))
            .catch(err => console.error('[DEBUG] Simple query failed:', err));

        // Test with ordering  
        // const qOrdered = query(collection(firestore, 'messages'), where('conversationId', '==', 'test'), orderBy('createdAt', 'desc'));
        // getDocs(qOrdered)
        //     .then(() => console.log('[DEBUG] Ordered query WORKS'))
        //     .catch(err => console.error('[DEBUG] Ordered query FAILED:', err));
    }

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

        // Automation Hook: Send reply notification to user
        this.triggerAutomation('sendReply', {
            userId: userId,
            message: content
        });
    }

    listenToConversation(conversationId: string, callback: (messages: Message[]) => void): () => void {
        console.log('[DEBUG] Messages query:', { collection: 'messages', where: ['conversationId', '==', conversationId], orderBy: ['createdAt', 'desc'] });
        const q = query(
            collection(firestore, 'messages'),
            where('conversationId', '==', conversationId),
            // orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            callback(messages);
        });
    }

    listenToAllMessages(callback: (messages: Message[]) => void): () => void {
        const q = query(
            collection(firestore, 'messages'),
            // orderBy('createdAt', 'desc')
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

        const adminEmail = environment.adminEmail || 'admin@innera-platform.com';

        if (event === 'sendMessage') {
            const userEmail = data.email;
            const userName = localStorage.getItem('userName') || 'User';
            const messageContent = data.message;

            // Trigger webhook for message received by admin
            this.webhookService.triggerMessageReceived(userEmail, userName, 'admin', adminEmail, 'Admin', messageContent);
        } else if (event === 'sendReply') {
            const userId = data.userId;
            const messageContent = data.message;
            const userEmail = userId; // In this app, userId is often the email

            // Trigger webhook for message sent confirmation to user
            this.webhookService.triggerMessageSent(userEmail, 'User', userId, adminEmail, 'Admin', messageContent);
        }
    }
}
