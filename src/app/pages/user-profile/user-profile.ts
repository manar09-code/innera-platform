import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Comment {
  username: string;
  text: string;
  time: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  comments: Comment[];
  tags: string[];
  type: string;
  likedBy: string[];
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css'],
})
export class UserProfileComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';
  communityName: string = '';
  userPassword: string = '********'; // Hidden
  profilePicture: string = '👤'; // Default avatar
  backgroundImage: string = 'url(https://via.placeholder.com/800x200)'; // Placeholder background
  isAdmin: boolean = false;

  // Mock data for likes, comments, posts (in real app, fetch from service)
  userLikes: Post[] = [];
  userComments: Comment[] = [];
  userPosts: Post[] = [];

  // Edit modes
  editingUsername: boolean = false;
  editingEmail: boolean = false;
  editingCommunity: boolean = false;
  editingPassword: boolean = false;

  // Temp values for editing
  tempUsername: string = '';
  tempEmail: string = '';
  tempCommunity: string = '';
  tempPassword: string = '';
  userRole!: string;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadUserData();
    this.loadUserActivity();
  }

goBack(){  
  if (this.userRole === 'admin') {
      this.router.navigate(['/feed']);
    } else {
      this.router.navigate(['/feed']);
    }
  }
    loadUserData() {
    this.userName = localStorage.getItem('userName') || '';
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.communityName = this.authService.getCommunityName() || '';
    this.isAdmin = localStorage.getItem('userRole') === 'admin';
    this.tempUsername = this.userName;
    this.tempEmail = this.userEmail;
    this.tempCommunity = this.communityName;
  }

  loadUserActivity() {
    // Mock data - in real app, fetch from backend or shared service
    const mockPosts: Post[] = [
      {
        id: 1,
        author: this.userName,
        avatar: this.profilePicture,
        content: 'My first post!',
        time: '1 day ago',
        likes: 5,
        comments: [],
        tags: [],
        type: 'text',
        likedBy: [],
      },
    ];

    this.userPosts = mockPosts.filter((p) => p.author === this.userName);

    // Mock likes and comments
    this.userLikes = mockPosts.filter((p) => p.likedBy.includes(this.userName));
    this.userComments = mockPosts.flatMap((p) =>
      p.comments.filter((c) => c.username === this.userName)
    );
  }

  startEdit(field: string) {
    switch (field) {
      case 'Username':
        this.editingUsername = true;
        break;
      case 'Email':
        this.editingEmail = true;
        break;
      case 'Community':
        this.editingCommunity = true;
        break;
      case 'Password':
        this.editingPassword = true;
        break;
    }
  }

  saveEdit(field: string) {
    let tempValue: string;
    switch (field) {
      case 'Username':
        tempValue = this.tempUsername;
        if (tempValue.trim()) {
          this.userName = tempValue;
          localStorage.setItem('userName', tempValue);
        }
        this.editingUsername = false;
        break;
      case 'Email':
        tempValue = this.tempEmail;
        if (tempValue.trim()) {
          this.userEmail = tempValue;
          localStorage.setItem('userEmail', tempValue);
        }
        this.editingEmail = false;
        break;
      case 'Community':
        tempValue = this.tempCommunity;
        if (tempValue.trim()) {
          this.communityName = tempValue;
          this.authService.setCommunityName(tempValue);
        }
        this.editingCommunity = false;
        break;
      case 'Password':
        tempValue = this.tempPassword;
        if (tempValue.trim()) {
          this.userPassword = tempValue;
          // In real app, hash and save password
        }
        this.editingPassword = false;
        break;
    }
  }

  cancelEdit(field: string) {
    switch (field) {
      case 'Username':
        this.tempUsername = this.userName;
        this.editingUsername = false;
        break;
      case 'Email':
        this.tempEmail = this.userEmail;
        this.editingEmail = false;
        break;
      case 'Community':
        this.tempCommunity = this.communityName;
        this.editingCommunity = false;
        break;
      case 'Password':
        this.tempPassword = this.userPassword;
        this.editingPassword = false;
        break;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  navigateToHistory() {
    this.router.navigate(['/history']);
  }

  navigateToStats() {
    this.router.navigate(['/stats']);
  }
}
