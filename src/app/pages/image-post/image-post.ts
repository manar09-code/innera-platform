import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';

interface ImagePost {
  id: number;
  imageData: string;
  caption: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-image-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-post.html',
  styleUrls: ['./image-post.css'],
})
export class ImagePostComponent {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  caption: string = '';
  isEditing: boolean = false;
  posts: ImagePost[] = [];
  selectedPost: ImagePost | null = null;

  constructor(private router: Router, private authService: AuthService, private postService: PostService) {
    this.loadPosts();
  }

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

  takePhoto() {
    // Placeholder for camera functionality
    alert('Camera functionality not implemented yet.');
  }

  async createPost() {
    if (!this.imagePreview || !this.caption.trim()) return;

    try {
      const communityName = this.authService.getCommunityName() || 'Innera Platform';
      const userName = localStorage.getItem('userName') || 'Anonymous';
      const userEmail = localStorage.getItem('userEmail') || '';

      const userRole = localStorage.getItem('userRole') || 'user';
      await this.postService.createPost({
        author: userName,
        avatar: userName.charAt(0).toUpperCase(),
        content: this.caption.trim(),
        tags: [],
        type: 'image',
        userId: userEmail,
        communityName: communityName,
        imageData: this.imagePreview,
        authorRole: userRole as 'admin' | 'user'
      });

      this.resetForm();
      this.goBack();
    } catch (error) {
      console.error('Error creating image post:', error);
      alert('Error creating post. Please try again.');
    }
  }



  resetForm() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.caption = '';
  }

  goBack() {
    this.router.navigate(['/feed']);
  }

  loadPosts() {
    const savedPosts = localStorage.getItem('imagePosts');
    if (savedPosts) {
      this.posts = JSON.parse(savedPosts);
    }
  }

  savePosts() {
    localStorage.setItem('imagePosts', JSON.stringify(this.posts));
  }

  updateFeedWithNewPost(newPost: ImagePost) {
    // Placeholder for updating feed
    console.log('New post added:', newPost);
  }

  selectPost(post: ImagePost) {
    this.selectedPost = post;
    this.imagePreview = post.imageData;
    this.caption = post.caption;
    this.isEditing = true;
  }

  updatePost() {
    if (!this.selectedPost || !this.imagePreview || !this.caption.trim()) return;

    this.selectedPost.imageData = this.imagePreview;
    this.selectedPost.caption = this.caption.trim();
    this.selectedPost.updatedAt = new Date().toISOString();

    this.savePosts();
    this.resetForm();
    this.isEditing = false;
    this.selectedPost = null;
  }

  deletePost() {
    if (!this.selectedPost) return;

    this.posts = this.posts.filter(p => p.id !== this.selectedPost!.id);
    this.savePosts();
    this.resetForm();
    this.isEditing = false;
    this.selectedPost = null;
  }
}
