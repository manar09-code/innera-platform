import {
  Component,
  OnInit,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  Input,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter, Subscription } from 'rxjs';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase.config';

import { PostService } from '../../services/post.service';
import { ConfigService } from '../../services/config.service';
import { AiService } from '../../services/ai.service';

interface Message {
  text: string;
  time: Date;
  isUser: boolean;
}

interface FeedPostSummary {
  author: string;
  content: string;
  time: Date;
  likes: number;
  comments: number;
  tags: string[];
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrls: ['./ai-assistant.css'],
})
export class AiAssistantComponent
  implements OnInit, AfterViewChecked, OnDestroy {

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @Input() currentPage: string = '';
  @Input() userRole: string = '';

  isOpen = false;
  isLoading = false;
  userMessage = '';
  messages: Message[] = [];

  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private http: HttpClient,
    private postService: PostService,
    private configService: ConfigService,
    private aiService: AiService
  ) { }

  /* -------------------- Lifecycle -------------------- */

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || '';
    this.currentPage = this.router.url.split('/')[1] || 'home';

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentPage = this.router.url.split('/')[1] || 'home';
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  /* -------------------- UI -------------------- */

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  /* -------------------- Core Logic -------------------- */

  async sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return;

    const message = this.userMessage.trim();
    this.userMessage = '';
    this.isLoading = true;

    // Add user message
    this.messages.push({
      text: message,
      time: new Date(),
      isUser: true,
    });

    try {
      // Always fetch latest admin instructions and news
      const config = await this.configService.getConfig();

      if (!config.openaiKey) {
        this.messages.push({
          text: 'AI Assistant is not configured. Please ask the admin to provide a Gemini API Key in the "Config AI" page.',
          time: new Date(),
          isUser: false,
        });
        return;
      }

      // ✅ Build context and call AI
      const context = await this.buildContext(config);

      const reply = await this.aiService.getChatResponse(message, context, config.openaiKey);

      this.messages.push({
        text: reply || 'Sorry, I could not generate a response.',
        time: new Date(),
        isUser: false,
      });

    } catch (error: any) {
      console.error('AI Assistant error:', error);
      const errorMsg = error.message || 'Unknown error';
      this.messages.push({
        text: `Sorry, something went wrong: ${errorMsg}. Please try again later.`,
        time: new Date(),
        isUser: false,
      });
    } finally {
      this.isLoading = false;
    }
  }

  /* -------------------- Helpers -------------------- */

  private isCommunityQuestion(message: string): boolean {
    const keywords = [
      'community',
      'tunisia hood',
      'post',
      'feed',
      'comment',
      'member',
      'rules',
      'guidelines',
      'learning',
      'resource',
      'admin',
      'platform'
    ];

    const lower = message.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  private async buildContext(config: { instructions: string; news: string }): Promise<any> {
    const userEmail = localStorage.getItem('userEmail') || '';
    const communityName = localStorage.getItem('communityName') || '';

    let feedPosts: FeedPostSummary[] = [];

    try {
      const posts = await this.postService.getPosts(communityName);
      feedPosts = posts.slice(0, 10).map((post: any) => ({
        author: post.author,
        content: post.content,
        time: post.time?.toDate?.() || new Date(),
        likes: post.likes || 0,
        comments: post.comments?.length || 0,
        tags: post.tags || []
      }));
    } catch (err) {
      console.error('Error loading feed context:', err);
    }

    return {
      page: this.currentPage,
      role: this.userRole,
      userEmail,
      communityName,
      aiInstructions: config.instructions,
      news: config.news,
      feedPosts
    };
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch { }
  }
}
