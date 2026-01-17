import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Member {
  id: number;
  name: string;
  email: string;
  isBlocked?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class UserManagementComponent implements OnInit {
  members: Member[] = [];
  newMemberName: string = '';
  newMemberEmail: string = '';
  communityName: string = '';
  joinLink: string = '';
  userRole!: string;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.userRole = localStorage.getItem('userRole') || 'user';
    this.loadMockData();
  }

  goBack() {
    if (this.userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  loadMockData() {
    // Mock members data
    this.members = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    ];

    // Mock community data
    this.communityName = this.authService.getCommunityName() || 'My Community';
    this.joinLink =
      'https://example.com/join/' + this.communityName.toLowerCase().replace(/\s+/g, '-');
  }

  addMember() {
    if (this.newMemberName.trim() && this.newMemberEmail.trim()) {
      const newMember: Member = {
        id: this.members.length + 1,
        name: this.newMemberName.trim(),
        email: this.newMemberEmail.trim(),
      };
      this.members.push(newMember);
      this.newMemberName = '';
      this.newMemberEmail = '';
    }
  }

  deleteMember(memberId: number) {
    this.members = this.members.filter((member) => member.id !== memberId);
  }

  blockMember(memberId: number) {
    const member = this.members.find((m) => m.id === memberId);
    if (member) {
      member.isBlocked = !member.isBlocked;
      // Here you would typically update the backend/database
      // For now, we're just toggling the state locally
    }
  }

  copyJoinLink() {
    navigator.clipboard.writeText(this.joinLink).then(() => {
      alert('Join link copied to clipboard!');
    });
  }

  inviteMember() {
    // Logic to invite member, e.g., send email or generate invite link
    alert('Invite functionality not implemented yet. Member invited via email or link.');
  }
}
