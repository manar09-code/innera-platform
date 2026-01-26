import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PostService, Post, Comment } from '../../services/post.service';
import { SeedService } from '../../services/seed.service';
import { NavbarComponent } from '../../components/navbar/navbar';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, TranslatePipe],
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
  newReplyText: { [commentId: string]: string } = {};
  showReplyInput: { [commentId: string]: boolean } = {};
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

  get displayCommunityName(): string {
    if (!this.communityName) return 'My Community';
    return this.communityName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async ngOnInit() {
    // ISSUE 9 FIX: Wait for profile restoration from localStorage/Firestore
    await this.authService.isInitialized;

    // Subscribe to community changes to keep feed in sync
    this.routerSubscription = this.authService.communityName$.subscribe(name => {
      if (name) {
        this.communityName = name;
        this.loadPostsFromFirestore();
        this.initializePopularPosts();
      }
    });

    this.userName = localStorage.getItem('userName') || '';
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userRole = localStorage.getItem('userRole') || '';
    this.isAdmin = this.userRole === 'admin';

    if (this.communityName === 'Tunisia Hood') {
      this.isAdmin = true;
    }

    if (this.communityName) {
      this.loadPostsFromFirestore();
    }

    this.loadWelcomeCardState();

    try {
      this.adminName = await this.authService.getAdminNameForCommunity(this.communityName);
    } catch (e) {
      console.warn('Could not fetch admin name:', e);
    }

    this.initializePopularPosts();
    this.initializeActiveMembers();

    // routerSubscription also handles navigation back to feed
    this.routerSubscription.add(this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && (event.url === '/feed' || event.urlAfterRedirects === '/feed')) {
        this.loadPostsFromFirestore();
        this.initializePopularPosts();
      }
    }));
  }

  popularPosts: Post[] = [];
  activeMembers: any[] = [];
  currentTag: string | null = null;
  filteredPosts: Post[] = [];

  constructor(private router: Router, private authService: AuthService, private postService: PostService, private seedService: SeedService) { }

  isSeeding = false;
  async seedCommunity() {
    if (this.isSeeding) return;
    this.isSeeding = true;
    try {
      await this.seedService.seedInitialPosts(this.communityName);
      // Stats/feed will auto-refresh due to real-time listeners
    } catch (e) {
      console.error('Seed failed', e);
    } finally {
      this.isSeeding = false;
    }
  }

  async loadPostsFromFirestore() {
    if (!this.communityName) {
      this.communityName = this.authService.getCommunityName();
    }

    if (!this.communityName) {
      console.warn('[FeedComponent] Cannot load posts: communityName is empty');
      return;
    }

    try {
      console.log(`[FeedComponent] Loading feed for: "${this.communityName}"`);

      // Cleanup previous listener
      if (this.postsUnsubscribe) {
        this.postsUnsubscribe();
      }

      // Listen to real-time updates
      this.postsUnsubscribe = this.postService.listenToPosts(this.communityName, async (posts: Post[]) => {
        // Clean up old comment listeners
        this.commentUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.commentUnsubscribers.clear();

        // Sort posts: pinned first, then by createdAt (handling different date fields via the service map)
        const sortedPosts = posts.sort((a: Post, b: Post) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        this.posts = sortedPosts;
        this.applyFilter();

        this.initializePopularPosts();
        this.initializeActiveMembers();

        // Refresh comment listeners
        this.posts.forEach(post => {
          const unsubscribe = this.postService.listenToComments(post.id, (comments: Comment[]) => {
            post.comments = this.buildCommentTree(comments);
            this.initializePopularPosts();
          });
          this.commentUnsubscribers.set(post.id, unsubscribe);
        });

        // RECOVERY LOGIC if feed is totally empty
        if (this.posts.length === 0) {
          console.log('[FeedComponent] Feed empty, running automatic recovery...');

          let recoveredCount = 0;

          // 1. Try to recover by Hashtag (User requested)
          // If in "Tunisia Hood", look for posts with #Tunisia tags
          const communityKey = this.communityName.split(' ')[0].toLowerCase();
          const allPosts = await this.postService.getPosts(this.communityName); // Already includes variations

          if (this.userEmail) {
            const userHistory = await this.postService.getUserPosts(this.userEmail);
            const orphaned = userHistory.filter(p => {
              const pComm = p.communityName.toLowerCase().replace(/[-_]/g, ' ');
              const cComm = this.communityName.toLowerCase().replace(/[-_]/g, ' ');

              // Match by name or by specific hashtag
              const hasMatchingTag = p.tags && p.tags.some((t: string) => t.toLowerCase().includes(communityKey));

              return (pComm === cComm || hasMatchingTag) && p.communityName !== this.communityName;
            });

            if (orphaned.length > 0) {
              console.log(`[FeedComponent] Automatically migrating ${orphaned.length} posts for recovery.`);
              for (const p of orphaned) {
                await this.postService.updatePost(p.id, { communityName: this.communityName });
                recoveredCount++;
              }
              if (recoveredCount > 0) return; // New snap will trigger
            }
          }

          // 2. If STILL empty, seed default posts
          if (this.posts.length === 0) {
            this.seedInitialPosts();
          }
        }
      });
    } catch (error) {
      console.error('[FeedComponent] Error in loadPostsFromFirestore:', error);
    }
  }

  // Helper for seeding to keep main method clean
  async seedInitialPosts() {
    console.log('No posts found, seeding...');
    try {
      await this.seedService.seedInitialPosts(this.communityName);
    } catch (e) { console.error(e); }
  }

  applyFilter() {
    if (this.currentTag) {
      this.filteredPosts = this.posts.filter(post => post.tags && post.tags.includes(this.currentTag!));
    } else {
      this.filteredPosts = this.posts;
    }
  }

  onHashtagClick(tag: string): void {
    if (this.currentTag === tag) {
      this.currentTag = null; // Toggle off
    } else {
      this.currentTag = tag;
    }
    this.applyFilter();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private initializePopularPosts(): void {
    // Score = Likes * 2 + Comments * 1
    this.popularPosts = [...this.posts].sort((a, b) => {
      const scoreA = (a.likes || 0) * 2 + (a.comments?.length || 0);
      const scoreB = (b.likes || 0) * 2 + (b.comments?.length || 0);
      return scoreB - scoreA;
    }).slice(0, 3);
  }

  private initializeActiveMembers(): void {
    // Calculate top authors from posts
    const authorCounts = new Map<string, number>();
    const authorAvatars = new Map<string, string>();

    this.posts.forEach(post => {
      const count = authorCounts.get(post.author) || 0;
      authorCounts.set(post.author, count + 1);
      if (!authorAvatars.has(post.author)) {
        authorAvatars.set(post.author, post.avatar || '👤');
      }
    });

    const sortedAuthors = Array.from(authorCounts.entries()).sort((a, b) => b[1] - a[1]);

    this.activeMembers = sortedAuthors.slice(0, 5).map(([name, count]) => ({
      name,
      avatar: authorAvatars.get(name),
      activity: count
    }));
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
    // Toggle comment input visibility
  }

  async submitComment(post: Post): Promise<void> {
    const text = this.newCommentText[post.id]?.trim();
    if (text) {
      try {
        await this.postService.addComment(post.id, {
          username: this.userName || 'Anonymous',
          text: text,
          userId: this.userEmail,
          communityName: this.communityName
        });
        this.newCommentText[post.id] = ''; // Clear the input
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
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

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading: boolean = false;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  switchTabUI(tab: string): void {
    this.currentTab = tab;
    // Removed automatic navigation to separate pages
    this.imagePreview = null;
    this.selectedFile = null;
  }

  async handlePostSubmit(): Promise<void> {
    if (!this.postText.trim() && !this.selectedFile) return;

    try {
      this.isUploading = true;
      let imageUrl: string | undefined;

      if (this.currentTab === 'image' && this.selectedFile) {
        imageUrl = await this.postService.uploadImage(this.selectedFile);
      }

      await this.postService.createPost({
        author: this.userName || 'Anonymous',
        avatar: this.userName.charAt(0).toUpperCase(),
        content: this.postText.trim(),
        tags: this.postText.match(/#\w+/g) || [],
        type: this.currentTab === 'post' ? 'text' : 'image',
        userId: this.userEmail,
        communityName: this.communityName,
        authorRole: this.userRole as 'admin' | 'user',
        imageData: imageUrl
      });

      this.postText = '';
      this.imagePreview = null;
      this.selectedFile = null;
      this.isUploading = false;
    } catch (error) {
      this.isUploading = false;
      console.error('Error creating post:', error);
      this.showNotification('Error creating post', 'error');
    }
  }

  trackByPostId(index: number, post: Post): string {
    return post.id;
  }

  removeWelcomeCard(): void {
    this.showWelcomeCard = false;
    const welcomeCardKey = `welcome_card_hidden_${this.userEmail}`; // Session specific
    sessionStorage.setItem(welcomeCardKey, 'true');
  }

  loadWelcomeCardState(): void {
    const welcomeCardKey = `welcome_card_hidden_${this.userEmail}`;
    const isHidden = sessionStorage.getItem(welcomeCardKey);
    this.showWelcomeCard = isHidden !== 'true';
  }

  toggleReplyInput(commentId: string): void {
    this.showReplyInput[commentId] = !this.showReplyInput[commentId];
  }

  async submitReply(comment: Comment, postId: string): Promise<void> {
    const text = this.newReplyText[comment.id]?.trim();
    if (text) {
      try {
        await this.postService.addComment(postId, {
          username: this.userName || 'Anonymous',
          text: text,
          userId: this.userEmail,
          communityName: this.communityName
        }, comment.id);
        this.newReplyText[comment.id] = ''; // Clear the input
        this.showReplyInput[comment.id] = false; // Hide the input
      } catch (error) {
        console.error('Error adding reply:', error);
      }
    }
  }

  buildCommentTree(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and add replies array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
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
