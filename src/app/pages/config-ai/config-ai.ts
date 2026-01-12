import { Component, OnInit } from '@angular/core';
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

  constructor(private fb: FormBuilder) {
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
    this.loadInstructions();
    this.loadCommunityInfo();
  }

  loadInstructions(): void {
    this.savedInstructions = localStorage.getItem('aiInstructions');
    if (this.savedInstructions) {
      this.configForm.patchValue({ instructions: this.savedInstructions });
    }
  }

  saveInstructions(): void {
    if (this.configForm.valid) {
      const instructions = this.configForm.value.instructions;
      localStorage.setItem('aiInstructions', instructions);
      this.savedInstructions = instructions;
      alert('AI instructions saved successfully!');
    }
  }

  loadCommunityInfo(): void {
    const communityInfo = localStorage.getItem('communityInfo');
    if (communityInfo) {
      this.savedCommunityInfo = JSON.parse(communityInfo);
      this.communityForm.patchValue(this.savedCommunityInfo);
    }
  }

  saveCommunityInfo(): void {
    if (this.communityForm.valid) {
      const communityInfo = this.communityForm.value;
      localStorage.setItem('communityInfo', JSON.stringify(communityInfo));
      this.savedCommunityInfo = communityInfo;
      alert('Community info saved successfully!');
    }
  }
}
