import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Member {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  members: Member[] = [];
  newMemberName: string = '';
  newMemberEmail: string = '';
  communityName: string = '';
  joinLink: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadMockData();
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

  copyJoinLink() {
    navigator.clipboard.writeText(this.joinLink).then(() => {
      alert('Join link copied to clipboard!');
    });
  }
}
