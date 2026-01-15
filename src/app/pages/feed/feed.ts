import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar';

interface Comment {
  username: string;
  text: string;
  time: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  comments: Comment[];
  tags: string[];
  type: string;
  likedBy: string[];
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class FeedComponent implements OnInit {
  // Removed unimplemented methods unrelated to comments
  communityName: string = '';
  adminName: string = '';
  userName: string = '';
  userEmail: string = '';
  userRole: string = '';
  newCommentText: { [postId: number]: string } = {};
  currentTab: string = 'post';
  postText: string = '';

  posts: Post[] = [
    {
      id: 1,
      author: 'Ahmed Ben Ali',
      avatar: '👨',
      content:
        'Exploring the beautiful beaches of Hammamet this weekend! The Mediterranean sea is calling. 🏖️',
      time: '2 hours ago',
      likes: 15,
      comments: [],
      tags: ['#Tunisia', '#Hammamet', '#BeachLife'],
      type: 'text',
      likedBy: [],
    },
    {
      id: 2,
      author: 'Fatima Trabelsi',
      avatar: '👩',
      content:
        'Just tried the most amazing couscous at a local restaurant in Tunis. Traditional flavors never disappoint! 🍲',
      time: '1 hour ago',
      likes: 22,
      comments: [],
      tags: ['#TunisianFood', '#Couscous', '#Culture'],
      type: 'text',
      likedBy: [],
    },
    {
      id: 3,
      author: 'Mohamed Saidi',
      avatar: '🧑',
      content:
        'The architecture in Sidi Bou Said is absolutely stunning. White and blue everywhere! 🏛️',
      time: '3 hours ago',
      likes: 18,
      comments: [],
      tags: ['#SidiBouSaid', '#Architecture', '#Travel'],
      type: 'text',
      likedBy: [],
    },
  ];

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
  popularPosts: Post[] = [];
  activeMembers: any[] = [];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.communityName = this.authService.getCommunityName() || 'Innera Platform';
    this.adminName = this.authService.getAdminNameForCommunity(this.communityName);
    this.userName = localStorage.getItem('userName') || '';
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userRole = localStorage.getItem('userRole') || '';
    this.loadPostsFromStorage();
    this.initializePopularPosts();
    this.initializeActiveMembers();
  }

  loadPostsFromStorage() {
    const userEmail = localStorage.getItem('userEmail') || '';
    const feedPostsKey = `feed_posts_${userEmail}`;
    const storedPosts = localStorage.getItem(feedPostsKey);
    if (storedPosts) {
      this.posts = JSON.parse(storedPosts);
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

  navigateToAiAssistant(): void {
    this.router.navigate(['/ai-assistant']);
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

  onLikePost(post: Post): void {
    if (!this.userName || this.userName.trim() === '') {
      return; // Only allow likes for logged-in users
    }
    const index = post.likedBy.indexOf(this.userName);
    if (index === -1) {
      // User hasn't liked, so like it
      post.likedBy.push(this.userName);
      post.likes++;
    } else {
      // User has liked, so unlike it
      post.likedBy.splice(index, 1);
      post.likes--;
    }
  }

  onCommentPost(post: Post): void {
    // Toggle comment input visibility (for now, just focus or something, but since it's always visible, maybe do nothing or scroll)
    // For simplicity, since input is always there, perhaps no action needed
  }

  submitComment(post: Post): void {
    const text = this.newCommentText[post.id]?.trim();
    if (text) {
      const newComment: Comment = {
        username: this.userName || 'Anonymous',
        text: text,
        time: new Date().toLocaleString(),
      };
      post.comments.push(newComment);
      this.newCommentText[post.id] = ''; // Clear the input
    }
  }

  onHashtagClick(tag: string): void {
    console.log('Clicked hashtag:', tag);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  deletePost(post: Post): void {
    if (this.isAdmin) {
      this.posts = this.posts.filter((p) => p.id !== post.id);
      this.showNotification('Post deleted successfully', 'success');
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

  handlePostSubmit(): void {
    if (this.postText.trim()) {
      const newPost: Post = {
        id: this.posts.length + 1,
        author: this.userName || 'Anonymous',
        avatar: this.userName.charAt(0).toUpperCase(),
        content: this.postText,
        time: 'Just now',
        likes: 0,
        comments: [],
        tags: [],
        type: this.currentTab === 'post' ? 'text' : 'image',
        likedBy: [],
      };
      this.posts.unshift(newPost); // Add to the beginning of the array
      this.postText = ''; // Clear the input
      this.initializePopularPosts(); // Update popular posts
      this.savePostsToStorage(); // Save to localStorage
    }
  }

  savePostsToStorage(): void {
    const userEmail = localStorage.getItem('userEmail') || '';
    const feedPostsKey = `feed_posts_${userEmail}`;
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

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }
}
