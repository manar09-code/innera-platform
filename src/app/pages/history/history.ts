import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  comments: any[];
  tags: string[];
  type: string;
  likedBy: string[];
}

interface Comment {
  username: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
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

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || '';
    this.loadHistory();
  }

  loadHistory() {
    const userName = localStorage.getItem('userName') || '';
    const userEmail = localStorage.getItem('userEmail') || '';

    // Load posts
    const storedPosts = localStorage.getItem(`posts_${userEmail}`);
    if (storedPosts) {
      const allPosts: Post[] = JSON.parse(storedPosts);
      this.userPosts = allPosts.filter((p) => p.author === userName);
    }

    // Load image posts
    const storedImagePosts = localStorage.getItem(`imagePosts_${userEmail}`);
    if (storedImagePosts) {
      const allImagePosts: any[] = JSON.parse(storedImagePosts);
      const imagePostsAsPosts: Post[] = allImagePosts.map((ip) => ({
        id: ip.id,
        author: ip.author,
        avatar: '👤',
        content: ip.caption,
        time: new Date(ip.createdAt).toLocaleString(),
        likes: 0,
        comments: [],
        tags: [],
        type: 'image',
        likedBy: [],
      }));
      this.userPosts = [
        ...this.userPosts,
        ...imagePostsAsPosts.filter((p) => p.author === userName),
      ];
    }

    // Mock likes and comments (in real app, track separately)
    this.userLikes = this.userPosts.slice(0, 5); // Mock
    this.userComments = [
      { username: userName, text: 'Great post!', time: '2 hours ago' },
      { username: userName, text: 'Thanks for sharing', time: '1 day ago' },
    ];

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
