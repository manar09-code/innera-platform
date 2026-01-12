import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface ImagePost {
  id: number;
  imageData: string; // base64
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
export class ImagePostComponent implements OnInit {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  caption: string = '';
  posts: ImagePost[] = [];
  selectedPost: ImagePost | null = null;
  isEditing: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    const userEmail = localStorage.getItem('userEmail') || '';
    const storedPosts = localStorage.getItem(`imagePosts_${userEmail}`);
    if (storedPosts) {
      this.posts = JSON.parse(storedPosts);
    }
  }

  savePosts() {
    const userEmail = localStorage.getItem('userEmail') || '';
    localStorage.setItem(`imagePosts_${userEmail}`, JSON.stringify(this.posts));
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

  createPost() {
    if (!this.imagePreview || !this.caption.trim()) return;

    const newPost: ImagePost = {
      id: Date.now(),
      imageData: this.imagePreview,
      caption: this.caption.trim(),
      author: localStorage.getItem('userName') || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.posts.unshift(newPost);
    this.savePosts();
    this.resetForm();
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
  }

  deletePost() {
    if (!this.selectedPost) return;

    this.posts = this.posts.filter((p) => p.id !== this.selectedPost!.id);
    this.savePosts();
    this.resetForm();
  }

  resetForm() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.caption = '';
    this.selectedPost = null;
    this.isEditing = false;
  }

  goBack() {
    this.router.navigate(['/feed']);
  }
}
