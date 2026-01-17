import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-config-ai',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './config-ai.html',
  styleUrls: ['./config-ai.css'],
})
export class ConfigAiComponent implements OnInit {
  configForm: FormGroup;
  communityForm: FormGroup;
  savedInstructions: string | null = null;
  savedCommunityInfo: any = null;
  userRole!: string;

  constructor(private fb: FormBuilder, private router: Router) {
    this.configForm = this.fb.group({
      instructions: ['', Validators.required],
    });
    this.communityForm = this.fb.group({
      description: ['', Validators.required],
      rules: ['', Validators.required],
      memberCount: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole') || 'user';
    this.loadInstructions();
    this.loadCommunityInfo();
  }

  goBack(): void {
    if (this.userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  loadInstructions(): void {
    this.savedInstructions = localStorage.getItem('aiInstructions');
    if (this.savedInstructions) {
      this.configForm.patchValue({ instructions: this.savedInstructions });
    }
  }

  async saveInstructions(): Promise<void> {
    if (this.configForm.valid) {
      const instructions = this.configForm.value.instructions;
      localStorage.setItem('aiInstructions', instructions);
      this.savedInstructions = instructions;
      
      // Also save to Firestore for backend access
      try {
        // Note: In a real app, you'd use Firebase SDK here
        // For now, we'll store in localStorage and the backend will check Firestore
        alert('AI instructions saved successfully!');
      } catch (error) {
        console.error('Error saving instructions:', error);
        alert('Instructions saved locally, but could not sync to server.');
      }
    }
  }

  loadCommunityInfo(): void {
    const communityInfo = localStorage.getItem('communityInfo');
    if (communityInfo) {
      this.savedCommunityInfo = JSON.parse(communityInfo);
      this.communityForm.patchValue(this.savedCommunityInfo);
    }
  }

  async saveCommunityInfo(): Promise<void> {
    if (this.communityForm.valid) {
      const communityInfo = this.communityForm.value;
      localStorage.setItem('communityInfo', JSON.stringify(communityInfo));
      this.savedCommunityInfo = communityInfo;
      
      // Also save to Firestore for backend access
      try {
        // Note: In a real app, you'd use Firebase SDK here
        alert('Community info saved successfully!');
      } catch (error) {
        console.error('Error saving community info:', error);
        alert('Community info saved locally, but could not sync to server.');
      }
    }
  }
}
