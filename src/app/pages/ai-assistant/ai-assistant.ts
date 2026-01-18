import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { HttpClient } from '@angular/common/http';
import { filter, Subscription } from 'rxjs';
import { PostService } from '../../services/post.service';

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
export class AiAssistantComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @Input() currentPage: string = '';
  @Input() userRole: string = '';

  isOpen = false;
  isLoading = false;
  userMessage = '';
  messages: Message[] = [];
  private routerSubscription?: Subscription;

  constructor(private router: Router, private http: HttpClient, private postService: PostService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || '';
    this.currentPage = this.router.url.split('/')[1] || 'home';
    // Update currentPage when route changes
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentPage = this.router.url.split('/')[1] || 'home';
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

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
      // Gather context for AI
      const context = await this.buildContext();

      // Call Firebase function
      const response = await this.http.post<{ reply: string }>(
        'https://us-central1-innera-platform.cloudfunctions.net/aiChat',
        {
          message,
          context
        }
      ).toPromise();

      // Add AI response
      this.messages.push({
        text: response?.reply || 'Sorry, I couldn\'t generate a response.',
        time: new Date(),
        isUser: false,
      });
    } catch (error) {
      console.error('Error calling AI service:', error);
      this.messages.push({
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        time: new Date(),
        isUser: false,
      });
    } finally {
      this.isLoading = false;
    }
  }

  private async buildContext(): Promise<any> {
    const userEmail = localStorage.getItem('userEmail') || '';
    const communityName = localStorage.getItem('communityName') || '';

    // Get admin instructions
    const aiInstructions = localStorage.getItem('aiInstructions') || '';

    // Get community info
    const communityInfoStr = localStorage.getItem('communityInfo');
    let communityInfo = null;
    if (communityInfoStr) {
      try {
        communityInfo = JSON.parse(communityInfoStr);
      } catch (e) {
        console.error('Error parsing community info:', e);
      }
    }

    // Get recent feed posts (limit to last 10) from Firestore
    let feedPosts: FeedPostSummary[] = [];
    try {
      const posts = await this.postService.getPosts(communityName);
      feedPosts = posts.slice(0, 10).map((post: any) => ({
        author: post.author,
        content: post.content,
        time: post.time.toDate(),
        likes: post.likes,
        comments: post.comments.length,
        tags: post.tags
      }));
    } catch (error) {
      console.error('Error getting posts for AI context:', error);
    }

    return {
      page: this.currentPage,
      role: this.userRole,
      userEmail,
      communityName,
      aiInstructions,
      communityInfo,
      feedPosts
    };
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
