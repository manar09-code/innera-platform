import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-webhook-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webhook-test.component.html',
  styleUrls: ['./webhook-test.component.css']
})
export class WebhookTestComponent {
  testResults: string[] = [];
  isLoading = false;
  environment = environment;

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  // Test LOGIN webhook
  async testLoginWebhook() {
    this.addLog('🧪 Testing LOGIN webhook...');

    const payload = {
      user_email: 'test@email.com',
      user_name: 'Test User',
      action: 'user_login',
      timestamp: new Date().toISOString(),
      user_id: 'test123',
      platform: 'web'
    };

    this.addLog(`URL: ${environment.webhooks.login}`);
    this.addLog(`Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      await this.http.post(environment.webhooks.login, payload).toPromise();
      this.addLog('✅ LOGIN webhook SUCCESS! Check your email.');
    } catch (error: any) {
      this.addLog(`❌ LOGIN webhook FAILED: ${error.message}`);
      this.addLog(`Full error: ${JSON.stringify(error)}`);
    }
  }

  // Test PROFILE webhook
  async testProfileWebhook() {
    this.addLog('🧪 Testing PROFILE webhook...');

    const payload = {
      user_email: 'test@email.com',
      user_name: 'Test User',
      action: 'profile_update',
      timestamp: new Date().toISOString(),
      user_id: 'test123',
      changes_summary: '• name: Changed to "Test Name"\n• bio: Changed to "Test Bio"',
      platform: 'Innera Social Media'
    };

    this.addLog(`URL: ${environment.webhooks.profileUpdate}`);

    try {
      await this.http.post(environment.webhooks.profileUpdate, payload).toPromise();
      this.addLog('✅ PROFILE webhook SUCCESS!');
    } catch (error: any) {
      this.addLog(`❌ PROFILE webhook FAILED: ${error.message}`);
    }
  }

  // Test MESSAGE webhooks
  async testMessageWebhooks() {
    this.addLog('🧪 Testing MESSAGE webhooks...');

    // Test 1: Message Sent (user confirmation)
    const sentPayload = {
      user_email: 'test@email.com',
      user_name: 'Test User',
      user_id: 'test123',
      admin_email: environment.adminEmail || 'admin@innera-platform.com',
      admin_name: 'Community Admin',
      action: 'message_sent',
      message_preview: 'This is a test message for debugging...',
      timestamp: new Date().toISOString(),
      platform: 'Innera Social Media'
    };

    this.addLog(`Message Sent URL: ${environment.webhooks.messageSent}`);

    try {
      await this.http.post(environment.webhooks.messageSent, sentPayload).toPromise();
      this.addLog('✅ MESSAGE SENT webhook SUCCESS!');
    } catch (error: any) {
      this.addLog(`❌ MESSAGE SENT webhook FAILED: ${error.message}`);
    }

    // Test 2: Message Received (admin notification)
    const receivedPayload = {
      user_email: 'test@email.com',
      user_name: 'Test User',
      user_id: 'test123',
      admin_email: environment.adminEmail || 'admin@innera-platform.com',
      admin_name: 'Community Admin',
      action: 'message_received',
      message: 'This is a test message for debugging webhooks.',
      timestamp: new Date().toISOString(),
      platform: 'Innera Social Media'
    };

    this.addLog(`Message Received URL: ${environment.webhooks.messageReceived}`);

    try {
      await this.http.post(environment.webhooks.messageReceived, receivedPayload).toPromise();
      this.addLog('✅ MESSAGE RECEIVED webhook SUCCESS!');
    } catch (error: any) {
      this.addLog(`❌ MESSAGE RECEIVED webhook FAILED: ${error.message}`);
    }
  }

  // Test with REAL current user
  async testWithRealUser() {
    const user = this.auth.currentUser;
    if (!user || !user.email) {
      this.addLog('❌ No user logged in!');
      return;
    }

    this.addLog(`👤 Testing with REAL user: ${user.email}`);

    const payload = {
      user_email: user.email,
      user_name: user.displayName || user.email.split('@')[0],
      action: 'user_login',
      timestamp: new Date().toISOString(),
      user_id: user.uid,
      platform: 'web'
    };

    try {
      await this.http.post(environment.webhooks.login, payload).toPromise();
      this.addLog(`✅ REAL USER webhook SUCCESS for ${user.email}`);
    } catch (error: any) {
      this.addLog(`❌ REAL USER webhook FAILED: ${error.message}`);
    }
  }

  // Test ALL webhooks at once
  async testAllWebhooks() {
    this.isLoading = true;
    this.testResults = [];

    this.addLog('🚀 STARTING ALL WEBHOOK TESTS...');

    await this.testLoginWebhook();
    await this.testProfileWebhook();
    await this.testMessageWebhooks();
    await this.testWithRealUser();

    this.addLog('🎯 ALL TESTS COMPLETE!');
    this.isLoading = false;
  }

  // Clear logs
  clearLogs() {
    this.testResults = [];
  }

  // Helper to add log
  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.testResults.push(`[${timestamp}] ${message}`);
    console.log(message);
  }
}
