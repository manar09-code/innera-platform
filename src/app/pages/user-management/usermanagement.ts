import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Member {
  id: string | number;
  name: string;
  email: string;
  isBlocked?: boolean;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './usermanagement.html',
  styleUrls: ['./usermanagement.css'],
})
export class UserManagementComponent implements OnInit {
  members: Member[] = [];
  newMemberName: string = '';
  newMemberEmail: string = '';
  communityName: string = '';
  joinLink: string = '';
  userRole!: string;

  constructor(private authService: AuthService, private router: Router) { }

  async ngOnInit() {
    // ISSUE 9 FIX: Wait for community recovery before loading members
    await this.authService.isInitialized;
    this.loadData();
  }

  goBack() {
    if (this.userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  async loadData() {
    this.userRole = localStorage.getItem('userRole') || 'user';
    this.communityName = this.authService.getCommunityName() || 'My Community';
    this.joinLink = 'https://example.com/join/' + this.communityName.toLowerCase().replace(/\s+/g, '-');

    // Load members from AuthService
    try {
      const members = await this.authService.getMembers();
      this.members = members.map(m => ({
        id: m.id, // Ensure ID mismatch is handled (string vs number)
        name: m.username || m.adminName || 'Unknown',
        email: m.email,
        isBlocked: m.isBlocked
      }));
    } catch (e) {
      console.error("Error loading members", e);
    }
  }

  addMember() {
    // This would typically involve cloud functions to create auth accounts
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
