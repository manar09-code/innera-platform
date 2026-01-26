import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class HistoryComponent implements OnInit, OnDestroy {
  userPosts: Post[] = [];
  userLikes: Post[] = [];
  userComments: Comment[] = [];
  profilePicture: string = '👤';
  backgroundImage: string = 'url(https://via.placeholder.com/800x200)';
  userRole: string = '';

  private unsubs: (() => void)[] = [];

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

  ngOnDestroy() {
    this.unsubs.forEach(unsub => unsub());
  }

  loadHistory() {
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || '';

    if (userEmail) {
      // Real-time Posts
      this.unsubs.push(this.postService.listenToUserPosts(userEmail, (posts: Post[]) => {
        this.userPosts = posts;
        this.postsTotalPages = Math.ceil(this.userPosts.length / this.postsItemsPerPage);
      }));

      // Real-time Likes
      if (userName) {
        this.unsubs.push(this.postService.listenToUserLikedPosts(userName, (likes: Post[]) => {
          this.userLikes = likes;
          this.likesTotalPages = Math.ceil(this.userLikes.length / this.likesItemsPerPage);
        }));
      }

      // Real-time Comments
      this.unsubs.push(this.postService.listenToUserComments(userEmail, (comments: Comment[]) => {
        this.userComments = comments;
        this.commentsTotalPages = Math.ceil(this.userComments.length / this.commentsItemsPerPage);
      }));
    }
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
    return new Date(time);
  }

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
// This closes the HistoryComponent class.
