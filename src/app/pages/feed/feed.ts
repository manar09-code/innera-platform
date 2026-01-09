import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-feed',
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
  standalone: true,
  imports: [CommonModule]
})
export class FeedComponent implements OnInit, AfterViewInit {
  @ViewChild('postInput') postInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('postBtn') postBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('postsFeed') postsFeed!: ElementRef<HTMLDivElement>;

  posts: Post[] = [];
  trendingTags: string[] = ['#Football', '#Voyage', '#Message', '#Musique', '#Cuisine'];
  private postIdCounter: number = 3;
  currentTab: string = 'post';

  constructor() {}

  ngOnInit(): void {
    this.initializePosts();
  }

  ngAfterViewInit(): void {
    this.attachEventListeners();
    this.updatePostButtonState();
  }

  private initializePosts(): void {
    this.posts = [
      {
        id: 1,
        author: 'Sophie Durand',
        avatar: '👩',
        time: '3h',
        content: 'Quel match incroyable ce soir ! Brave à notre équipe pour cette victoire !',
        tags: ['#Football', '#Victoire'],
        likes: 218,
        comments: 38
      },
      {
        id: 2,
        author: 'Sophie Durand',
        avatar: '👩',
        time: '3m',
        content: 'Je viens de publier mon nouveau shoot photo sur les hauteurs. Venez découvrir !',
        tags: ['#Photography', '#Art'],
        likes: 145,
        comments: 23
      },
      {
        id: 3,
        author: 'Marc Pierre',
        avatar: '👨',
        time: '1h',
        content: 'Nouveau voyage en Italie, les paysages sont absolument magnifiques !',
        tags: ['#Voyage', '#Italie'],
        likes: 392,
        comments: 67
      }
    ];
  }

  private attachEventListeners(): void {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const postInput = document.getElementById('postInput') as HTMLTextAreaElement;

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        this.switchTabUI(target.getAttribute('data-tab') || 'post');
      });
    });

    if (postInput) {
      postInput.addEventListener('input', () => {
        this.updatePostButtonState();
      });
    }
  }

  handlePostSubmit(): void {
    const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
    const content = postInput?.value.trim();

    if (!content) {
      this.showNotification('Please write something before posting!', 'error');
      return;
    }

    const newPost: Post = {
      id: ++this.postIdCounter,
      author: 'Alex Martin',
      avatar: '👤',
      time: 'just now',
      content: content,
      tags: this.extractHashtags(content),
      likes: 0,
      comments: 0
    };

    this.posts.unshift(newPost);
    postInput.value = '';
    this.updatePostButtonState();
    this.showNotification('Post published successfully!', 'success');
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#\w+/g;
    return content.match(hashtagRegex) || [];
  }

  updatePostButtonState(): void {
    const postBtn = document.getElementById('postBtn') as HTMLButtonElement;
    const postInput = document.getElementById('postInput') as HTMLTextAreaElement;

    if (postBtn && postInput) {
      postBtn.disabled = !postInput.value.trim();
    }
  }

  switchTabUI(tabName: string): void {
    this.currentTab = tabName;
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach((btn) => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      }
    });

    console.log(`Switched to ${tabName} tab`);
  }

  private filterByHashtag(hashtag: string): void {
    console.log(`Filtering posts by ${hashtag}`);
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    const bgColor = type === 'success' 
      ? 'linear-gradient(135deg, #FFB84D 0%, #FF9800 100%)' 
      : 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)';

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  onPostInput(): void {
    this.updatePostButtonState();
  }

  onHashtagClick(hashtag: string): void {
    this.filterByHashtag(hashtag);
  }

  onLikePost(post: Post): void {
    post.likes++;
  }

  onCommentPost(post: Post): void {
    this.showNotification('Comment feature coming soon!', 'error');
  }

  getPosts(): Post[] {
    return this.posts;
  }

  getPostCount(): number {
    return this.posts.length;
  }

  getTotalLikes(): number {
    return this.posts.reduce((sum, post) => sum + post.likes, 0);
  }

  getTotalComments(): number {
    return this.posts.reduce((sum, post) => sum + post.comments, 0);
  }
}