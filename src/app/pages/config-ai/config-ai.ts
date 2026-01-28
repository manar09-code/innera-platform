import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase.config';
import { ConfigService } from '../../services/config.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-config-ai',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './config-ai.html',
  styleUrls: ['./config-ai.css'],
})
export class ConfigAiComponent implements OnInit, OnDestroy {
  configForm: FormGroup;
  communityForm: FormGroup;
  savedInstructions: string = '';
  savedCommunityInfo: any = null;
  memberCount: number = 0;
  userRole!: string;
  private instructionsUnsubscribe: (() => void) | null = null;
  private membersUnsubscribe: (() => void) | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private configService: ConfigService,
    private authService: AuthService
  ) {
    this.configForm = this.fb.group({
      instructions: ['', Validators.required],
      news: [''],
      openaiKey: ['']
    });
    this.communityForm = this.fb.group({
      description: ['', Validators.required],
      rules: ['', Validators.required],
      memberCount: [0, Validators.required],
    });
  }

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole') || 'user';
    this.loadAiConfig();
    this.loadCommunityInfo();
    this.listenToMembersCount();
  }

  ngOnDestroy(): void {
    if (this.instructionsUnsubscribe) {
      this.instructionsUnsubscribe();
    }
    if (this.membersUnsubscribe) {
      this.membersUnsubscribe();
    }
  }

  goBack(): void {
    if (this.userRole === 'admin') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/user-profile']);
    }
  }

  async loadCommunityInfo(): Promise<void> {
    try {
      const configRef = doc(firestore, 'config', 'community');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        const data = snap.data();
        this.savedCommunityInfo = data;
        this.communityForm.patchValue(data);
      }
    } catch (error) {
      console.error('Error loading community info:', error);
    }
  }

  async loadAiConfig(): Promise<void> {
    try {
      const config = await this.configService.getConfig();
      this.savedInstructions = config.instructions;
      this.configForm.patchValue({
        instructions: config.instructions,
        news: config.news,
        openaiKey: config.openaiKey
      });
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  }

  async saveAiConfig(): Promise<void> {
    if (this.configForm.valid) {
      const instructions = this.configForm.value.instructions;
      const news = this.configForm.value.news || '';
      const openaiKey = (this.configForm.value.openaiKey || '').trim();
      try {
        await this.configService.saveConfig(instructions, news, openaiKey);
        this.savedInstructions = instructions; // For display, though we might want to display news too
        alert('AI configuration saved successfully!');
      } catch (error: any) {
        console.error('Error saving AI config:', error);
        alert(`Error saving AI configuration: ${error.message || error}`);
      }
    }
  }

  listenToMembersCount(): void {
    this.membersUnsubscribe = this.authService.listenToMembersCount((count: number) => {
      this.memberCount = count;
    });
  }

  async saveCommunityInfo(): Promise<void> {
    if (this.communityForm.valid) {
      const communityInfo = this.communityForm.value;
      try {
        // Save to Firestore or handle as needed
        const configRef = doc(firestore, 'config', 'community');
        await setDoc(configRef, communityInfo);
        this.savedCommunityInfo = communityInfo;
        alert('Community info saved successfully!');
      } catch (error) {
        console.error('Error saving community info:', error);
        alert('Error saving community info.');
      }
    }
  }


}
