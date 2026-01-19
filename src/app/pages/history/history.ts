import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PostService, Post, Comment } from '../../services/post.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
})
export class HistoryComponent implements OnInit {
  userPosts: Post[] = [];
  userLikes: Post[] = [];
  userComments: Comment[] = [];
  profilePicture: string = '👤';
  backgroundImage: string = 'url(https://via.placeholder.com/800x200)';
  userRole: string = '';

  // Pagination for posts
  postsCurrentPage: number = 1;
  postsItemsPerPage: number = 5;
  postsTotalPages: number = 0;

  // Pagination for likes
  likesCurrentPage: number = 1;
  likesItemsPerPage: number = 5;
  likesTotalPages: number = 0;

  // Pagination for comments
  commentsCurrentPage: number = 1;
  commentsItemsPerPage: number = 5;
  commentsTotalPages: number = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private postService: PostService
  ) { }

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || '';
    this.loadHistory();
  }

  async loadHistory() {
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || '';

    if (userEmail) {
      // Load User Posts
      this.userPosts = await this.postService.getUserPosts(userEmail);

      // Load User Likes
      this.userLikes = await this.postService.getUserLikedPosts(userName);

      // Load User Comments
      this.userComments = await this.postService.getUserComments(userEmail);
    }

    // Calculate total pages
    this.postsTotalPages = Math.ceil(this.userPosts.length / this.postsItemsPerPage);
    this.likesTotalPages = Math.ceil(this.userLikes.length / this.likesItemsPerPage);
    this.commentsTotalPages = Math.ceil(this.userComments.length / this.commentsItemsPerPage);
  }

  goBack() {
    if (this.userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  toDate(time: any): Date | null {
    if (!time) return null;
    if (time instanceof Timestamp) {
      return time.toDate();
    }
    // Handle string or number if legacy data exists
    return new Date(time);
  }

  // Pagination methods for posts
  getPostsForCurrentPage(): Post[] {
    const startIndex = (this.postsCurrentPage - 1) * this.postsItemsPerPage;
    const endIndex = startIndex + this.postsItemsPerPage;
    return this.userPosts.slice(startIndex, endIndex);
  }

  nextPostsPage(): void {
    if (this.postsCurrentPage < this.postsTotalPages) {
      this.postsCurrentPage++;
    }
  }

  prevPostsPage(): void {
    if (this.postsCurrentPage > 1) {
      this.postsCurrentPage--;
    }
  }

  // Pagination methods for likes
  getLikesForCurrentPage(): Post[] {
    const startIndex = (this.likesCurrentPage - 1) * this.likesItemsPerPage;
    const endIndex = startIndex + this.likesItemsPerPage;
    return this.userLikes.slice(startIndex, endIndex);
  }

  nextLikesPage(): void {
    if (this.likesCurrentPage < this.likesTotalPages) {
      this.likesCurrentPage++;
    }
  }

  prevLikesPage(): void {
    if (this.likesCurrentPage > 1) {
      this.likesCurrentPage--;
    }
  }

  // Pagination methods for comments
  getCommentsForCurrentPage(): Comment[] {
    const startIndex = (this.commentsCurrentPage - 1) * this.commentsItemsPerPage;
    const endIndex = startIndex + this.commentsItemsPerPage;
    return this.userComments.slice(startIndex, endIndex);
  }

  nextCommentsPage(): void {
    if (this.commentsCurrentPage < this.commentsTotalPages) {
      this.commentsCurrentPage++;
    }
  }

  prevCommentsPage(): void {
    if (this.commentsCurrentPage > 1) {
      this.commentsCurrentPage--;
    }
  }
}
