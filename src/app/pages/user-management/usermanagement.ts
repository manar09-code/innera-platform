import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PostService, Post, Comment } from '../../services/post.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './usermanagement.html',
  styleUrls: ['./usermanagement.css'],
})
export class UserManagementComponent implements OnInit, OnDestroy {
  members: any[] = [];
  newMemberName: string = '';
  newMemberEmail: string = '';
  communityName: string = '';
  joinLink: string = '';
  userRole!: string;

  private unsubs: (() => void)[] = [];

  constructor(private authService: AuthService, private router: Router, private postService: PostService) { }

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || 'user';
    this.loadData();
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => unsub());
  }

  goBack() {
    if (this.userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  async loadData() {
    this.communityName = this.authService.getCommunityName() || 'My Community';
    this.joinLink = 'https://example.com/join/' + this.communityName.toLowerCase().replace(/\s+/g, '-');

    const unsubMembers = this.authService.listenToMembers((users) => {
      // Clear old activity unsubs to avoid leaks when member list changes
      this.unsubs.forEach((u, i) => { if (i > 0) u(); }); // Keep member unsub at index 0
      this.unsubs = this.unsubs.slice(0, 1);

      this.members = users.map(u => ({
        id: u.id,
        name: u.username || u.adminName || 'Unknown',
        email: u.email,
        isBlocked: u.isBlocked,
        loginCount: u.loginCount || 0,
        postCount: 0,
        likeCount: 0,
        commentCount: 0
      }));

      // Set up activity listeners for each member
      this.members.forEach(member => {
        this.unsubs.push(this.postService.listenToUserPosts(member.email, (posts) => {
          member.postCount = posts.length;
        }));

        this.unsubs.push(this.postService.listenToUserComments(member.email, (comments) => {
          member.commentCount = comments.length;
        }));

        if (member.name !== 'Unknown') {
          this.unsubs.push(this.postService.listenToUserLikedPosts(member.name, (likes) => {
            member.likeCount = likes.length;
          }));
        }
      });
    });

    if (unsubMembers) this.unsubs.push(unsubMembers);
  }

  addMember() {
    alert("To add a member, they must register via the registration page.");
  }

  async deleteMember(memberId: any) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await this.authService.deleteUser(memberId.toString());
        this.members = this.members.filter((member) => member.id !== memberId);
      } catch (e) {
        alert('Error deleting user');
      }
    }
  }

  async blockMember(memberId: any) {
    const member = this.members.find((m) => m.id === memberId);
    if (member) {
      try {
        await this.authService.toggleBlockUser(memberId.toString(), !!member.isBlocked);
        member.isBlocked = !member.isBlocked;
      } catch (e) {
        alert('Error updating block status');
      }
    }
  }

  copyJoinLink() {
    navigator.clipboard.writeText(this.joinLink).then(() => {
      alert('Join link copied to clipboard!');
    });
  }

  inviteMember() {
    alert('Invite functionality not implemented yet. Member invited via email or link.');
  }
}
