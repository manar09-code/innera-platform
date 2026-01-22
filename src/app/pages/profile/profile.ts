import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase.config';

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
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';
  communityName: string = '';
  userPassword: string = '********'; // Hidden
  profilePicture: string = '👤'; // Default avatar
  backgroundImage: string = 'url(https://via.placeholder.com/800x200)'; // Placeholder background
  isAdmin: boolean = false;

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

  // Success feedback
  successMessage: string = '';

  // Mock data for likes, comments, posts (in real app, fetch from service)
  userLikes: Post[] = [];
  userComments: Comment[] = [];
  userPosts: Post[] = [];
  userRole!: string;

  constructor(private router: Router, private authService: AuthService) {}

  async ngOnInit() {
    await this.loadCurrentProfile();
  }

  goBack() {
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

  async loadCurrentProfile() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.data();

      this.userName = userData?.['username'] || userData?.['adminName'] || user.displayName || user.email?.split('@')[0] || 'Guest';
      this.userEmail = userData?.['email'] || user.email || '';
      this.communityName = userData?.['communityName'] || this.authService.getCommunityName() || '';
      this.isAdmin = userData?.['role'] === 'admin';
      this.userRole = userData?.['role'] || 'user';

      // Set temp values
      this.tempUsername = this.userName;
      this.tempEmail = this.userEmail;
      this.tempCommunity = this.communityName;
    } catch (error) {
      console.error('Error loading profile:', error);
    }
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

  async saveEdit(field: string) {
    let tempValue: string;
    let actualField = '';

    switch (field) {
      case 'Username':
        tempValue = this.tempUsername;
        actualField = 'username';
        break;
      case 'Email':
        tempValue = this.tempEmail;
        actualField = 'email';
        break;
      case 'Community':
        tempValue = this.tempCommunity;
        actualField = 'communityName';
        break;
      case 'Password':
        tempValue = this.tempPassword;
        actualField = 'password';
        break;
      default:
        return;
    }

    if (tempValue.trim()) {
      try {
        const user = this.authService.getCurrentUser();
        if (!user) throw new Error('No user logged in');

        // Get old data for comparison
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        const oldData = userDoc.data();

        // Prepare new data
        const newData: any = {};
        newData[actualField] = tempValue.trim();

        // Find what changed
        const changes: any = {};
        for (const key in newData) {
          if (newData[key] !== oldData?.[key]) {
            changes[key] = newData[key];
          }
        }

        // If no changes, exit
        if (Object.keys(changes).length === 0) {
          this.cancelEdit(field);
          return;
        }

        // Update Firebase
        await this.authService.updateUserProfile(actualField, tempValue.trim());

        // Show success
        this.successMessage = `${field} updated successfully!`;
        setTimeout(() => this.successMessage = '', 3000);

        // Update local UI state
        switch (field) {
          case 'Username':
            this.userName = tempValue;
            this.editingUsername = false;
            break;
          case 'Email':
            this.userEmail = tempValue;
            this.editingEmail = false;
            break;
          case 'Community':
            this.communityName = tempValue;
            this.editingCommunity = false;
            break;
          case 'Password':
            this.userPassword = tempValue;
            this.editingPassword = false;
            break;
        }

      } catch (error) {
        console.error('Error updating profile:', error);
        this.successMessage = `Failed to update ${field}. Please try again.`;
        setTimeout(() => this.successMessage = '', 3000);
      }
    } else {
      this.cancelEdit(field);
    }
  }

  private updateRegisteredUser(field: string, value: string) {
    const currentEmail = localStorage.getItem('userEmail');
    const currentRole = localStorage.getItem('userRole');

    // For admins, map 'username' to 'adminName'
    const actualField = currentRole === 'admin' && field === 'username' ? 'adminName' : field;

    if (currentRole === 'user') {
      const users = this.authService['getRegisteredUsers']();
      const userIndex = users.findIndex((u: any) => u.email === currentEmail);
      if (userIndex !== -1) {
        (users[userIndex] as any)[actualField] = value;
        this.authService['setRegisteredUsers'](users);
      }
    } else if (currentRole === 'admin') {
      const admins = this.authService['getRegisteredAdmins']();
      const adminIndex = admins.findIndex((a: any) => a.email === currentEmail);
      if (adminIndex !== -1) {
        (admins[adminIndex] as any)[actualField] = value;
        this.authService['setRegisteredAdmins'](admins);
      }
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

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToFeed() {
    this.router.navigate(['/feed']);
  }

  navigateToConfigAi() {
    this.router.navigate(['/config-ai']);
  }
}
