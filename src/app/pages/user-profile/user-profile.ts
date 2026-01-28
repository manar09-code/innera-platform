import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';
import { Firestore, doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase.config';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  userName: string = '';
  userEmail: string = '';
  communityName: string = '';
  userPassword: string = '********'; // Hidden
  profilePicture: string = '👤'; // Default avatar
  backgroundImage: string = 'url(https://via.placeholder.com/800x200)'; // Placeholder background
  isAdmin: boolean = false;

  userLikes: any[] = [];
  userComments: any[] = [];
  userPosts: any[] = [];

  editingUsername: boolean = false;
  editingEmail: boolean = false;
  editingCommunity: boolean = false;
  editingPassword: boolean = false;

  tempUsername: string = '';
  tempEmail: string = '';
  tempCommunity: string = '';
  tempPassword: string = '';
  userRole!: string;

  private unsubs: (() => void)[] = [];

  constructor(private router: Router, private authService: AuthService, private postService: PostService) { }

  async ngOnInit() {
    await this.authService.isInitialized;
    this.userRole = localStorage.getItem('userRole') || 'user';
    this.loadUserData();
    this.loadUserActivity();
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => unsub());
  }

  goBack() {
    this.router.navigate(['/feed']);
  }

  async loadUserData() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      const role = localStorage.getItem('userRole') || 'user';
      const community = this.authService.getCommunityName();
      const profileId = `${user.uid}_${role}_${community}`;

      let userDoc = await getDoc(doc(firestore, 'users', profileId));
      let userData = userDoc.data();

      if (!userDoc.exists()) {
        const q = query(collection(firestore, 'users'), where('id', '==', user.uid), where('role', '==', role));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userData = querySnapshot.docs[0].data();
        }
      }

      if (userData) {
        this.userName = userData['username'] || userData['adminName'] || user.displayName || 'Guest';
        this.userEmail = userData['email'] || user.email || '';
        this.communityName = userData['communityName'] || community || '';
        this.userRole = userData['role'] || 'user';
        this.isAdmin = this.userRole === 'admin';

        this.tempUsername = this.userName;
        this.tempEmail = this.userEmail;
        this.tempCommunity = this.communityName;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  get displayCommunityName(): string {
    if (!this.communityName) return 'My Community';
    return this.communityName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async loadUserActivity() {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');

    if (!email) return;

    try {
      this.unsubs.push(this.postService.listenToUserPosts(email, (posts: any[]) => {
        this.userPosts = posts;
      }));

      if (name) {
        this.unsubs.push(this.postService.listenToUserLikedPosts(name, (likes: any[]) => {
          this.userLikes = likes;
        }));
      }

      this.unsubs.push(this.postService.listenToUserComments(email, (comments: any[]) => {
        this.userComments = comments;
      }));
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  }

  startEdit(field: string) {
    if (field === 'Username') this.editingUsername = true;
    if (field === 'Email') this.editingEmail = true;
    if (field === 'Community') this.editingCommunity = true;
    if (field === 'Password') this.editingPassword = true;
  }

  async saveEdit(field: string) {
    let tempValue: string;
    try {
      if (field === 'Username') {
        tempValue = this.tempUsername;
        await this.authService.updateUserProfile('username', tempValue);
        this.userName = tempValue;
        this.editingUsername = false;
      } else if (field === 'Email') {
        tempValue = this.tempEmail;
        await this.authService.updateUserProfile('email', tempValue);
        this.userEmail = tempValue;
        this.editingEmail = false;
      } else if (field === 'Community') {
        tempValue = this.tempCommunity;
        await this.authService.updateUserProfile('communityName', tempValue);
        this.communityName = tempValue;
        this.editingCommunity = false;
      } else if (field === 'Password') {
        this.editingPassword = false;
      }
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
    }
  }

  cancelEdit(field: string) {
    if (field === 'Username') {
      this.tempUsername = this.userName;
      this.editingUsername = false;
    } else if (field === 'Email') {
      this.tempEmail = this.userEmail;
      this.editingEmail = false;
    } else if (field === 'Community') {
      this.tempCommunity = this.communityName;
      this.editingCommunity = false;
    } else if (field === 'Password') {
      this.editingPassword = false;
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
