import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError, of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private readonly webhookUrls = {
    userRegistration: environment.webhooks?.register || '',
    userLogin: environment.webhooks?.login || '',
    profileUpdate: environment.webhooks?.profileUpdate || '',
    messageSent: environment.webhooks?.messageSent || '',
    messageReceived: environment.webhooks?.messageReceived || ''
  };

  private readonly adminEmail = environment.adminEmail || 'admin@example.com';

  constructor(private http: HttpClient) { }

  /**
   * Trigger webhook for user registration
   */
  triggerUserRegistration(userEmail: string, userName: string, userId: string): void {
    const payload = {
      action: 'user_registration',
      timestamp: new Date().toISOString(),
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      platform: 'web'
    };

    this.sendWebhook(this.webhookUrls.userRegistration, 'userRegistration', payload);
  }

  /**
   * Trigger webhook for user login (optional)
   */
  triggerUserLogin(userEmail: string, userName: string): void {
    const payload = {
      action: 'user_login',
      timestamp: new Date().toISOString(),
      user_email: userEmail,
      user_name: userName,
      platform: 'web'
    };

    this.sendWebhook(this.webhookUrls.userLogin, 'userLogin', payload);
  }

  /**
   * Trigger webhook for profile update
   */
  triggerProfileUpdate(userEmail: string, userName: string, userId: string, changes: any): void {
    const payload = {
      user_email: userEmail,
      user_name: userName,
      action: 'profile_update',
      timestamp: new Date().toISOString(),
      user_id: userId,
      changes_summary: this.formatChangesSummary(changes),
      platform: 'Innera Social Media'
    };

    this.sendWebhook(this.webhookUrls.profileUpdate, 'profileUpdate', payload);
  }

  /**
   * Format changes object into bullet point summary
   */
  private formatChangesSummary(changes: any): string {
    return Object.keys(changes)
      .map(key => `• ${key}: Changed to "${changes[key]}"`)
      .join('\n');
  }

  /**
   * Trigger webhook for message sent confirmation to user
   */
  triggerMessageSent(userEmail: string, userName: string, userId: string, adminEmail: string, adminName: string, messageContent: string, communityName: string): void {
    const payload = {
      action: 'message_sent',
      timestamp: new Date().toISOString(),
      user_email: userEmail,
      user_name: userName,
      user_id: userId,
      admin_email: adminEmail,
      admin_name: adminName,
      message_content: messageContent,
      community_name: communityName, // ISSUE 1: Added community context to notification
      platform: 'web'
    };

    this.sendWebhook(this.webhookUrls.messageSent, 'messageSent', payload);
  }

  /**
   * Trigger webhook for message received notification to admin
   */
  triggerMessageReceived(userEmail: string, userName: string, userId: string, adminEmail: string, adminName: string, messageContent: string, communityName: string): void {
    const payload = {
      action: 'message_received',
      timestamp: new Date().toISOString(),
      user_email: userEmail,
      user_name: userName,
      user_id: userId,
      admin_email: adminEmail,
      admin_name: adminName,
      message_content: messageContent,
      community_name: communityName, // ISSUE 1: Added community context to notification
      platform: 'web'
    };

    this.sendWebhook(this.webhookUrls.messageReceived, 'messageReceived', payload);
  }

  /**
   * Send HTTP POST request to webhook URL
   */
  private sendWebhook(url: string, event: string, payload: any): void {
    console.log(`[Webhook Triggered] Event: ${event}, URL: ${url}`);
    // console.log(`[Webhook Payload]:`, payload);

    if (!url) {
      console.warn(`[Webhook] No URL configured for event: ${event}`);
      return;
    }

    this.http.post(url, payload, { responseType: 'text' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 0) {
            console.error(`[Webhook Network Error] Cannot reach: ${url}`);
          } else if (error.status === 200) {
            // Some webhooks return text which causes JSON parsing error if not handled,
            // but we use { responseType: 'text' } so 200 is always fine.
            console.log(`[Webhook Success] ${event}: Request completed.`);
          } else {
            console.error(`[Webhook HTTP Error] ${event}: Status ${error.status}`, error.message);
          }
          return of(null);
        })
      ).subscribe();
  }
}
