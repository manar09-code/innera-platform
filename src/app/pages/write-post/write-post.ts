import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-write-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './write-post.html',
  styleUrls: ['./write-post.css'],
})
export class WritePostComponent {
  postContent: string = '';
  isEditing: boolean = false;
  posts: any[] = [];
  selectedPost: any = null;

  constructor(private router: Router, private authService: AuthService, private postService: PostService) {
    this.loadPosts();
  }

  async createPost() {
    if (!this.postContent.trim()) return;

    try {
      const communityName = this.authService.getCommunityName() || 'Innera Platform';
      const userName = localStorage.getItem('userName') || 'Anonymous';
      const userEmail = localStorage.getItem('userEmail') || '';
      const userRole = localStorage.getItem('userRole') || 'user';

      await this.postService.createPost({
        author: userName,
        avatar: userName.charAt(0).toUpperCase(),
        content: this.postContent.trim(),
        tags: [],
        type: 'text',
        userId: userEmail,
        communityName: communityName,
        authorRole: userRole as 'admin' | 'user'
      });

      this.postContent = '';

      // Navigate back to feed to see the new post
      this.router.navigate(['/feed']);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    }
  }

  goBack() {
    this.router.navigate(['/feed']);
  }

  loadPosts() {
    const savedPosts = localStorage.getItem('textPosts');
    if (savedPosts) {
      this.posts = JSON.parse(savedPosts);
    }
  }

  savePosts() {
    localStorage.setItem('textPosts', JSON.stringify(this.posts));
  }

  selectPost(post: any) {
    this.selectedPost = post;
    this.postContent = post.content;
    this.isEditing = true;
  }

  updatePost() {
    if (!this.selectedPost || !this.postContent.trim()) return;

    this.selectedPost.content = this.postContent.trim();
    this.selectedPost.updatedAt = new Date().toISOString();

    this.savePosts();
    this.resetForm();
    this.isEditing = false;
    this.selectedPost = null;
  }

  cancelEdit() {
    this.resetForm();
    this.isEditing = false;
    this.selectedPost = null;
  }

  deletePost() {
    if (!this.selectedPost) return;

    this.posts = this.posts.filter(p => p.id !== this.selectedPost.id);
    this.savePosts();
    this.resetForm();
    this.isEditing = false;
    this.selectedPost = null;
  }

  resetForm() {
    this.postContent = '';
  }
}
