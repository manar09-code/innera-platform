import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface TextPost {
  id: number;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-write-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './write-post.html',
  styleUrls: ['./write-post.css'],
})
export class WritePostComponent implements OnInit {
  postContent: string = '';
  posts: TextPost[] = [];
  selectedPost: TextPost | null = null;
  isEditing: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    const userEmail = localStorage.getItem('userEmail') || '';
    const storedPosts = localStorage.getItem(`posts_${userEmail}`);
    if (storedPosts) {
      this.posts = JSON.parse(storedPosts);
    }
  }

  savePosts() {
    const userEmail = localStorage.getItem('userEmail') || '';
    localStorage.setItem(`posts_${userEmail}`, JSON.stringify(this.posts));
  }

  createPost() {
    if (!this.postContent.trim()) return;

    const newPost: TextPost = {
      id: Date.now(),
      content: this.postContent.trim(),
      author: localStorage.getItem('userName') || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.posts.unshift(newPost);
    this.savePosts();
    this.postContent = '';
    this.selectedPost = null;
    this.isEditing = false;
  }

  selectPost(post: TextPost) {
    this.selectedPost = post;
    this.postContent = post.content;
    this.isEditing = true;
  }

  updatePost() {
    if (!this.selectedPost || !this.postContent.trim()) return;

    this.selectedPost.content = this.postContent.trim();
    this.selectedPost.updatedAt = new Date().toISOString();
    this.savePosts();
    this.cancelEdit();
  }

  deletePost() {
    if (!this.selectedPost) return;

    this.posts = this.posts.filter((p) => p.id !== this.selectedPost!.id);
    this.savePosts();
    this.cancelEdit();
  }

  cancelEdit() {
    this.postContent = '';
    this.selectedPost = null;
    this.isEditing = false;
  }

  goBack() {
    this.router.navigate(['/feed']);
  }
}
