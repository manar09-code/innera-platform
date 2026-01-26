import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './stats.html',
  styleUrls: ['./stats.css'],
})
export class StatsComponent implements OnInit, OnDestroy {
  totalUsers: number = 0;
  totalLikesAndComments: number = 0;
  totalMessages: number = 0;
  totalPosts: number = 0;
  totalImagePosts: number = 0;
  totalTextPosts: number = 0;

  // User Stats
  myPostCount: number = 0;
  myCommentCount: number = 0;
  myLikeCount: number = 0;
  isAdmin: boolean = false;

  private unsubs: (() => void)[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private postService: PostService
  ) { }

  async ngOnInit() {
    await this.authService.isInitialized;
    this.isAdmin = localStorage.getItem('userRole') === 'admin';
    this.loadStats();
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => unsub());
  }

  async loadStats() {
    const communityName = this.authService.getCommunityName() || '';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || '';

    // Total Users
    const members = await this.authService.getMembers();
    this.totalUsers = members.length;

    // Real-time Community Stats
    if (communityName) {
      this.unsubs.push(this.postService.listenToCommunityStats(communityName, (stats) => {
        this.totalPosts = stats.totalPosts;
        this.totalImagePosts = stats.totalImagePosts;
        this.totalTextPosts = stats.totalTextPosts;
        this.totalLikesAndComments = stats.totalLikes + stats.totalComments;
      }));
    }

    // Real-time User specific stats
    if (userEmail) {
      this.unsubs.push(this.postService.listenToUserPosts(userEmail, (posts) => {
        this.myPostCount = posts.length;
      }));

      this.unsubs.push(this.postService.listenToUserComments(userEmail, (comments) => {
        this.myCommentCount = comments.length;
      }));

      if (userName) {
        this.unsubs.push(this.postService.listenToUserLikedPosts(userName, (liked) => {
          this.myLikeCount = liked.length;
        }));
      }
    }

    this.totalMessages = 0;
  }

  goBack(): void {
    if (this.isAdmin) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }
}
