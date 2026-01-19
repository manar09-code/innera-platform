import { Component, OnInit } from '@angular/core';
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
export class StatsComponent implements OnInit {
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private postService: PostService
  ) { }

  ngOnInit() {
    this.isAdmin = localStorage.getItem('userRole') === 'admin';
    this.loadStats();
  }

  async loadStats() {
    const communityName = this.authService.getCommunityName() || '';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || '';

    // Total Users
    const members = await this.authService.getMembers();
    this.totalUsers = members.length;

    // Community Stats from Posts
    const stats = await this.postService.getCommunityStats(communityName);
    this.totalPosts = stats.totalPosts;
    this.totalImagePosts = stats.totalImagePosts;
    this.totalTextPosts = stats.totalTextPosts;
    this.totalLikesAndComments = stats.totalLikes + stats.totalComments;

    // User specific stats
    if (userEmail) {
      try {
        const posts = await this.postService.getUserPosts(userEmail);
        this.myPostCount = posts.length;

        const comments = await this.postService.getUserComments(userEmail);
        this.myCommentCount = comments.length;

        if (userName) {
          const liked = await this.postService.getUserLikedPosts(userName);
          this.myLikeCount = liked.length;
        }
      } catch (e) {
        console.error('Error loading user stats:', e);
      }
    }

    this.totalMessages = 0;
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
