// This file is located in the src/app/services folder, which contains service files that provide reusable functionality across the application, such as authentication, data management, and external integrations. This file serves as the message service. Its role is to handle messaging between users and admins, including sending messages, listening to conversations, and triggering webhooks. It interacts with Firestore for message storage, AuthService for user authentication, WebhookService for external notifications, and the environment for configuration.
import { Injectable } from '@angular/core'; // This line imports the Injectable decorator from '@angular/core', which is needed to mark this class as a service that can be injected into other components and services.
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, getDocs } from 'firebase/firestore'; // This line imports various Firestore functions and types from the 'firebase/firestore' module, which are needed for database operations like adding documents, querying collections, and listening to real-time updates.
import { firestore } from '../firebase.config'; // This line imports the configured firestore instance from '../firebase.config', which is needed to perform database operations using the app's Firebase setup.
import { AuthService } from './auth.service'; // This line imports the AuthService from './auth.service', which is needed to access user authentication information.
import { WebhookService } from './webhook.service'; // This line imports the WebhookService from './webhook.service', which is needed to trigger external webhooks for messaging events.
import { environment } from '../../environments/environment'; // This line imports the environment configuration from '../../environments/environment', which contains settings like admin email for webhook triggers.

export interface Message { // This line defines the Message interface, which specifies the structure of message objects stored in Firestore, ensuring type safety and consistency.
    id?: string; // This line defines the optional id property, which is a string representing the unique identifier of the message.
    content: string; // This line defines the required content property, which is a string representing the text content of the message.
    senderId: string; // This line defines the required senderId property, which is a string representing the ID of the user who sent the message.
    senderName: string; // This line defines the required senderName property, which is a string representing the name of the user who sent the message.
    senderRole: string; // This line defines the required senderRole property, which is a string representing the role of the sender ('user' or 'admin').
    receiverId: string; // This line defines the required receiverId property, which is a string representing the ID of the recipient ('admin' for user->admin, or userId for admin->user).
    conversationId: string; // This line defines the required conversationId property, which is a string representing the conversation identifier (usually userId for 1:1 with admin).
    createdAt: Timestamp; // This line defines the required createdAt property, which is a Timestamp representing the time when the message was created.
} // This closes the Message interface, completing the definition of the message structure.

@Injectable({ // This line applies the Injectable decorator to the class, making it a service that can be injected into other components and services, with the providedIn option set to 'root' to make it a singleton service available throughout the app.
    providedIn: 'root' // This line specifies that the service is provided in the root injector, making it a singleton instance available app-wide.
}) // This closes the Injectable decorator configuration.
export class MessageService { // This line exports the MessageService class, which is the main message service class that handles messaging operations between users and admins.

    constructor(private authService: AuthService, private webhookService: WebhookService) { // This line defines the constructor for the MessageService class, which takes AuthService and WebhookService instances as parameters for dependency injection, used to access authentication and webhook functionality.
        // this.testMessagesIndex(); // This line is a commented out call to the testMessagesIndex method, which is used for debugging Firestore index issues.
    } // This closes the constructor.

    testMessagesIndex() { // This line defines the testMessagesIndex method, which returns void, used for debugging Firestore index issues by testing queries.
        console.log('[CRITICAL DEBUG] Testing messages index...'); // This line logs a debug message to the console indicating that the messages index is being tested.

        // Test without ordering // This line is a comment indicating the start of a test without ordering.
        const qSimple = query(collection(firestore, 'messages'), where('conversationId', '==', 'test')); // This line creates a simple query on the 'messages' collection filtering by conversationId equal to 'test'.
        getDocs(qSimple) // This line executes the simple query.
            .then(snap => console.log('[DEBUG] Simple query:', snap.size, 'docs')) // This line logs the number of documents returned by the simple query.
            .catch(err => console.error('[DEBUG] Simple query failed:', err)); // This line logs any error that occurs during the simple query.

        // Test with ordering // This line is a comment indicating the start of a test with ordering.
        // const qOrdered = query(collection(firestore, 'messages'), where('conversationId', '==', 'test'), orderBy('createdAt', 'desc')); // This line is a commented out query that includes ordering by createdAt in descending order.
        // getDocs(qOrdered) // This line is a commented out execution of the ordered query.
        //     .then(() => console.log('[DEBUG] Ordered query WORKS')) // This line is a commented out success log for the ordered query.
        //     .catch(err => console.error('[DEBUG] Ordered query FAILED:', err)); // This line is a commented out error log for the ordered query.
    } // This closes the testMessagesIndex method.

    async sendMessageToAdmin(content: string): Promise<void> { // This line defines the async sendMessageToAdmin method, which takes content parameter of type string and returns Promise<void>, used to send a message from the current user to the admin.
        let user: any = this.authService.getCurrentUser(); // This line gets the current user from the auth service.

        // Fallback to localStorage if state lost on reload // This line is a comment indicating the start of fallback logic for user state.
        if (!user) { // This line checks if the user is not available.
            const email = localStorage.getItem('userEmail'); // This line retrieves the user email from local storage.
            if (email) { // This line checks if the email is available.
                user = { email: email }; // This line sets the user object with the email.
            } else { // This line executes if the email is not available.
                alert("Please log in to send messages."); // This line shows an alert to the user to log in.
                throw new Error("User not logged in"); // This line throws an error indicating the user is not logged in.
            } // This closes the if-else block for email check.
        } // This closes the if block for user check.

        const userName = localStorage.getItem('userName') || 'User'; // This line gets the user name from local storage, defaulting to 'User' if not found.

        const message: any = { // This line creates a message object with the message details.
            content, // This line sets the content property.
            senderId: user.email, // This line sets the senderId to the user's email.
            senderName: userName, // This line sets the senderName to the user name.
            senderRole: 'user', // This line sets the senderRole to 'user'.
            receiverId: 'admin', // This line sets the receiverId to 'admin'.
            conversationId: user.email, // This line sets the conversationId to the user's email.
            createdAt: serverTimestamp() // This line sets the createdAt to the server timestamp.
        }; // This closes the message object.

        await addDoc(collection(firestore, 'messages'), message); // This line adds the message document to the 'messages' collection in Firestore.

        // Automation Hook: Send email // This line is a comment indicating the automation hook for sending email.
        this.triggerAutomation('sendMessage', { // This line calls the triggerAutomation method with the 'sendMessage' event.
            email: user.email, // This line passes the user's email.
            message: content // This line passes the message content.
        }); // This closes the triggerAutomation call.
    } // This closes the sendMessageToAdmin method.

    async sendReplyToUser(userId: string, content: string): Promise<void> { // This line defines the async sendReplyToUser method, which takes userId and content parameters of type string and returns Promise<void>, used to send a reply message from the admin to a specific user.
        const message: any = { // This line creates a message object for the reply.
            content, // This line sets the content property.
            senderId: 'admin', // This line sets the senderId to 'admin'.
            senderName: 'Admin', // This line sets the senderName to 'Admin'.
            senderRole: 'admin', // This line sets the senderRole to 'admin'.
            receiverId: userId, // This line sets the receiverId to the provided userId.
            conversationId: userId, // This line sets the conversationId to the provided userId.
            createdAt: serverTimestamp() // This line sets the createdAt to the server timestamp.
        }; // This closes the message object.
        await addDoc(collection(firestore, 'messages'), message); // This line adds the reply message document to the 'messages' collection in Firestore.

        // Automation Hook: Send reply notification to user // This line is a comment indicating the automation hook for sending reply notification.
        this.triggerAutomation('sendReply', { // This line calls the triggerAutomation method with the 'sendReply' event.
            userId: userId, // This line passes the userId.
            message: content // This line passes the message content.
        }); // This closes the triggerAutomation call.
    } // This closes the sendReplyToUser method.

    listenToConversation(conversationId: string, callback: (messages: Message[]) => void): () => void { // This line defines the listenToConversation method, which takes conversationId parameter of type string and callback parameter of type function, and returns a function to unsubscribe, used to listen to real-time updates for messages in a specific conversation.
        console.log('[DEBUG] Messages query:', { collection: 'messages', where: ['conversationId', '==', conversationId], orderBy: ['createdAt', 'desc'] }); // This line logs a debug message with the query details.
        const q = query( // This line creates a query for the 'messages' collection.
            collection(firestore, 'messages'), // This line specifies the collection to query.
            where('conversationId', '==', conversationId), // This line adds a filter for conversationId equal to the provided conversationId.
            // orderBy('createdAt', 'desc') // This line is a commented out orderBy clause for sorting by createdAt in descending order.
        ); // This closes the query.
        return onSnapshot(q, (snapshot) => { // This line sets up a real-time listener on the query, executing the callback with the snapshot.
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)); // This line maps the snapshot documents to Message objects with id.
            callback(messages); // This line calls the callback function with the messages array.
        }); // This closes the onSnapshot callback.
    } // This closes the listenToConversation method.

    listenToAllMessages(callback: (messages: Message[]) => void): () => void { // This line defines the listenToAllMessages method, which takes callback parameter of type function and returns a function to unsubscribe, used to listen to real-time updates for all messages.
        const q = query( // This line creates a query for the 'messages' collection.
            collection(firestore, 'messages'), // This line specifies the collection to query.
            // orderBy('createdAt', 'desc') // This line is a commented out orderBy clause for sorting by createdAt in descending order.
        ); // This closes the query.
        return onSnapshot(q, (snapshot) => { // This line sets up a real-time listener on the query, executing the callback with the snapshot.
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)); // This line maps the snapshot documents to Message objects with id.
            callback(messages); // This line calls the callback function with the messages array.
        }); // This closes the onSnapshot callback.
    } // This closes the listenToAllMessages method.

    // PASTE YOUR MAKE.COM WEBHOOK URL HERE // This line is a comment indicating where to paste the Make.com webhook URL.
    private automationWebhookUrl = ''; // This line declares a private property automationWebhookUrl of type string, initialized to an empty string, used to store the webhook URL.

    private triggerAutomation(event: string, data: any) { // This line defines the private triggerAutomation method, which takes event and data parameters and returns void, used to trigger automation based on the event type.
        console.log(`[Automation Triggered] Event: ${event}, Data:`, data); // This line logs a message to the console indicating that automation has been triggered.

        const adminEmail = environment.adminEmail || 'admin@innera-platform.com'; // This line gets the admin email from the environment, defaulting to 'admin@innera-platform.com'.

        if (event === 'sendMessage') { // This line checks if the event is 'sendMessage'.
            const userEmail = data.email; // This line gets the user email from the data.
            const userName = localStorage.getItem('userName') || 'User'; // This line gets the user name from local storage, defaulting to 'User'.
            const messageContent = data.message; // This line gets the message content from the data.

            // Trigger webhook for message received by admin // This line is a comment indicating the webhook trigger for message received by admin.
            this.webhookService.triggerMessageReceived(userEmail, userName, 'admin', adminEmail, 'Admin', messageContent); // This line calls the webhook service to trigger a message received webhook.
        } else if (event === 'sendReply') { // This line checks if the event is 'sendReply'.
            const userId = data.userId; // This line gets the userId from the data.
            const messageContent = data.message; // This line gets the message content from the data.
            const userEmail = userId; // This line sets userEmail to userId, as in this app, userId is often the email.

            // Trigger webhook for message sent confirmation to user // This line is a comment indicating the webhook trigger for message sent confirmation to user.
            this.webhookService.triggerMessageSent(userEmail, 'User', userId, adminEmail, 'Admin', messageContent); // This line calls the webhook service to trigger a message sent webhook.
        } // This closes the if-else block.
    } // This closes the triggerAutomation method.
} // This closes the MessageService class.
