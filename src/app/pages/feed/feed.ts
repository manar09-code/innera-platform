import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PostService, Post, Comment } from '../../services/post.service';
import { SeedService } from '../../services/seed.service';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class FeedComponent implements OnInit, OnDestroy {
  // Removed unimplemented methods unrelated to comments
  communityName: string = '';
  adminName: string = '';
  userName: string = '';
  userEmail: string = '';
  userRole: string = '';
  newCommentText: { [postId: string]: string } = {};
  currentTab: string = 'post';
  postText: string = '';
  showWelcomeCard: boolean = true;

  posts: Post[] = [];
  private postsUnsubscribe: (() => void) | null = null;
  private commentUnsubscribers: Map<string, () => void> = new Map();

  trendingTags: string[] = [
    '#Tunisia',
    '#TunisianCulture',
    '#Hammamet',
    '#Couscous',
    '#SidiBouSaid',
    '#TunisianFood',
    '#BeachLife',
  ];

  isAdmin: boolean = false;
  private routerSubscription!: Subscription;

  async ngOnInit() {
    this.communityName = this.authService.getCommunityName() || 'Innera Platform';
    this.adminName = await this.authService.getAdminNameForCommunity(this.communityName);
    this.userName = localStorage.getItem('userName') || '';
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userRole = localStorage.getItem('userRole') || '';
    this.isAdmin = this.userRole === 'admin';
    this.loadWelcomeCardState();
    this.loadPostsFromFirestore();
    this.initializePopularPosts();
    this.initializeActiveMembers();

    // Subscribe to router events to reload posts when navigating back to feed
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url === '/feed') {
        this.loadPostsFromFirestore();
        this.initializePopularPosts();
      }
    });
  }
  
  popularPosts: Post[] = [];
  activeMembers: any[] = [];

  constructor(private router: Router, private authService: AuthService, private postService: PostService, private seedService: SeedService) {}

  async loadPostsFromFirestore() {
    try {
      console.log('Loading posts for community:', this.communityName);

      // Unsubscribe from previous listener if exists
      if (this.postsUnsubscribe) {
        this.postsUnsubscribe();
      }

      // Listen to real-time updates
      this.postsUnsubscribe = this.postService.listenToPosts(this.communityName, (posts: Post[]) => {
        console.log('Received posts from Firestore:', posts.length, 'posts for community:', this.communityName);

        // Clean up old comment listeners
        this.commentUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.commentUnsubscribers.clear();

        // Sort posts: pinned first, then by time
        this.posts = posts.sort((a: Post, b: Post) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.time.toMillis() - a.time.toMillis(); // Newest first
        });
        this.initializePopularPosts();

        // Start listening to comments for each post
        this.posts.forEach(post => {
          const unsubscribe = this.postService.listenToComments(post.id, (comments: Comment[]) => {
            post.comments = comments;
          });
          this.commentUnsubscribers.set(post.id, unsubscribe);
        });

        // If no posts exist, seed initial posts
        if (this.posts.length === 0) {
          console.log('No posts found, attempting to seed initial posts for community:', this.communityName);
          this.seedService.seedInitialPosts(this.communityName).then(success => {
            if (success) {
              console.log('Successfully seeded initial posts');
            } else {
              console.error('Failed to seed initial posts');
            }
          }).catch(error => {
            console.error('Error during seeding:', error);
          });
        }
      });
    } catch (error) {
      console.error('Error loading posts from Firestore:', error);
    }
  }

  navigateToWritePost(): void {
    this.router.navigate(['/write-post']);
  }

  navigateToImagePost(): void {
    this.router.navigate(['/image-post']);
  }

  navigateToMessage(): void {
    this.router.navigate(['/message']);
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
  }

  navigateToProfile(): void {
    if (this.userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  navigateToConfigAi(): void {
    this.router.navigate(['/config-ai']);
  }

  navigateToStats(): void {
    this.router.navigate(['/stats']);
  }

  onPostOptionsClick(post: Post): void {
    if (post.type === 'text') {
      this.navigateToWritePost();
    } else if (post.type === 'image') {
      this.navigateToImagePost();
    }
  }

  async onLikePost(post: Post): Promise<void> {
    if (!this.userName || this.userName.trim() === '') {
      return; // Only allow likes for logged-in users
    }
    try {
      await this.postService.toggleLike(post.id, this.userEmail, this.userName);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  onCommentPost(post: Post): void {
    // Toggle comment input visibility (for now, just focus or something, but since it's always visible, maybe do nothing or scroll)
    // For simplicity, since input is always there, perhaps no action needed
  }

  async submitComment(post: Post): Promise<void> {
    const text = this.newCommentText[post.id]?.trim();
    if (text) {
      try {
        await this.postService.addComment(post.id, {
          username: this.userName || 'Anonymous',
          text: text,
          userId: this.userEmail
        });
        this.newCommentText[post.id] = ''; // Clear the input
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  }

  onHashtagClick(tag: string): void {
    console.log('Clicked hashtag:', tag);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  async deletePost(post: Post): Promise<void> {
    if (this.isAdmin) {
      try {
        await this.postService.deletePost(post.id);
        this.showNotification('Post deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting post:', error);
        this.showNotification('Error deleting post', 'error');
      }
    }
  }

  async pinPost(post: Post): Promise<void> {
    if (this.userRole === 'admin') {
      try {
        await this.postService.updatePost(post.id, { isPinned: !post.isPinned });
        this.showNotification(post.isPinned ? 'Post unpinned' : 'Post pinned', 'success');
      } catch (error) {
        console.error('Error pinning/unpinning post:', error);
        this.showNotification('Error updating post', 'error');
      }
    }
  }

  private initializePopularPosts(): void {
    // Sort posts by likes and take top 3
    this.popularPosts = [...this.posts].sort((a, b) => b.likes - a.likes).slice(0, 3);
  }

  private initializeActiveMembers(): void {
    // Mock active members data with Tunisian names
    this.activeMembers = [
      { avatar: '👨', name: 'Ahmed Ben Ali', activity: 250 },
      { avatar: '👩', name: 'Fatima Trabelsi', activity: 220 },
      { avatar: '🧑', name: 'Mohamed Saidi', activity: 200 },
      { avatar: '👨', name: 'Youssef Gharbi', activity: 180 },
      { avatar: '👩', name: 'Leila Mansouri', activity: 160 },
    ];
  }

  private showNotification(message: string, type: string): void {
    // TODO: Implement notification system
    alert(message);
  }

  getPostCount(): number {
    return this.posts.length;
  }

  getTotalLikes(): number {
    return this.posts.reduce((total, post) => total + post.likes, 0);
  }

  getTotalComments(): number {
    return this.posts.reduce((total, post) => total + post.comments.length, 0);
  }

  async handlePostSubmit(): Promise<void> {
    if (this.postText.trim()) {
      try {
        await this.postService.createPost({
          author: this.userName || 'Anonymous',
          avatar: this.userName.charAt(0).toUpperCase(),
          content: this.postText,
          tags: [],
          type: this.currentTab === 'post' ? 'text' : 'image',
          userId: this.userEmail,
          communityName: this.communityName
        });
        this.postText = ''; // Clear the input
      } catch (error) {
        console.error('Error creating post:', error);
        this.showNotification('Error creating post', 'error');
      }
    }
  }

  async seedPosts(): Promise<void> {
    try {
      const success = await this.seedService.seedInitialPosts(this.communityName);
      if (success) {
        this.showNotification('Sample posts added successfully!', 'success');
      } else {
        this.showNotification('Error seeding posts', 'error');
      }
    } catch (error) {
      console.error('Error seeding posts:', error);
      this.showNotification('Error seeding posts', 'error');
    }
  }

  savePostsToStorage(): void {
    const communityName = this.authService.getCommunityName() || '';
    const feedPostsKey = `feed_posts_${communityName}`;
    localStorage.setItem(feedPostsKey, JSON.stringify(this.posts));
  }

  onPostInput(): void {
    // Stub for input handling
  }

  switchTabUI(tab: string): void {
    this.currentTab = tab;
    if (tab === 'post') {
      this.navigateToWritePost();
    } else if (tab === 'image') {
      this.navigateToImagePost();
    }
  }

  trackByPostId(index: number, post: Post): string {
    return post.id;
  }

  removeWelcomeCard(): void {
    this.showWelcomeCard = false;
    const welcomeCardKey = `welcome_card_${this.userEmail}`;
    localStorage.setItem(welcomeCardKey, 'hidden');
  }

  loadWelcomeCardState(): void {
    const welcomeCardKey = `welcome_card_${this.userEmail}`;
    const hidden = localStorage.getItem(welcomeCardKey);
    this.showWelcomeCard = hidden !== 'hidden';
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.postsUnsubscribe) {
      this.postsUnsubscribe();
    }
    this.commentUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.commentUnsubscribers.clear();
  }
}
