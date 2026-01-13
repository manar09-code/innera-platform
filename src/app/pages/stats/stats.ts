import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrls: ['./stats.css'],
})
export class StatsComponent implements OnInit {
  totalUsers: number = 0;
  totalLikesAndComments: number = 0;
  totalMessages: number = 0;
  totalPosts: number = 0;
  totalImagePosts: number = 0;
  totalTextPosts: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    // Mock data
    this.totalUsers = 150; // Mock number of users/members
    this.totalLikesAndComments = 450; // Mock likes + comments
    this.totalMessages = 75; // Mock messages
    this.totalPosts = 320; // Mock total posts
    this.totalImagePosts = 120; // Mock image posts
    this.totalTextPosts = 200; // Mock text posts
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
