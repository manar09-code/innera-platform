import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Post {
  id: number;
  author: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  userRole: string | null = '';
  newPostContent = '';
  editingPostId: number | null = null;
  editContent = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole');

    if (!this.userRole) {
      this.router.navigate(['/login-admin']);
    }

    this.loadPosts();
  }

  loadPosts() {
    const storedPosts = localStorage.getItem('innera-posts');
    if (storedPosts) {
      this.posts = JSON.parse(storedPosts);
    } else {
      this.posts = [
        {
          id: 1,
          author: 'Sophie Durand',
          timestamp: '3 hours ago',
          content: 'Quel match incroyable ce soir! Bravo à notre équipe pour cette victoire! 🏆 #Football #Victoire',
          likes: 218,
          comments: 38
        },
        {
          id: 2,
          author: 'Sophie Durand',
          timestamp: '3 minutes ago',
          content: 'Je viens de publier mon nouveau shoot photo sur le beach! 📸 #Voyage #Mensage',
          likes: 142,
          comments: 24
        }
      ];
    }
  }

  savePosts() {
    localStorage.setItem('innera-posts', JSON.stringify(this.posts));
  }

  createPost() {
    if (this.newPostContent.trim() === '') {
      alert('Post cannot be empty');
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      author: localStorage.getItem('userEmail') || 'You',
      timestamp: 'now',
      content: this.newPostContent,
      likes: 0,
      comments: 0
    };

    this.posts.unshift(newPost);
    this.savePosts();
    this.newPostContent = '';
  }

  deletePost(id: number) {
    if (confirm('Delete this post?')) {
      this.posts = this.posts.filter(p => p.id !== id);
      this.savePosts();
    }
  }

  startEdit(post: Post) {
    this.editingPostId = post.id;
    this.editContent = post.content;
  }

  saveEdit(post: Post) {
    if (this.editContent.trim() === '') {
      alert('Post cannot be empty');
      return;
    }

    post.content = this.editContent;
    this.editingPostId = null;
    this.savePosts();
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editContent = '';
  }

  likePost(post: Post) {
    post.likes++;
    this.savePosts();
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}

