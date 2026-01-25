import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PostService } from '../../services/post.service';

interface ImagePost {
  id: number;
  imageData: string;
  caption: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-image-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-post.html',
  styleUrls: ['./image-post.css'],
})
export class ImagePostComponent {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  caption: string = '';
  isEditing: boolean = false;
  posts: ImagePost[] = [];
  selectedPost: ImagePost | null = null;

  constructor(private router: Router, private authService: AuthService, private postService: PostService) {
    this.initSync();
  }

  async initSync() {
    // ISSUE 9 FIX: Await profile restoration before loading data
    await this.authService.isInitialized;
    this.loadPosts();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('[ImagePost] File detected:', file.name, 'Size:', file.size, 'Type:', file.type);
      // STEP 5: Validate file type and size
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, etc.)');
        event.target.value = ''; // Reset input
        return;
      }

      // Check file size (max 2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Image size is too large. Please select an image smaller than 2MB.');
        event.target.value = ''; // Reset input
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  isUploading: boolean = false; // ISSUE 2: Loading feedback

  takePhoto() {
    // Placeholder for camera functionality
    alert('Camera functionality not implemented yet.');
  }

  async createPost() {
    if (!this.caption.trim() || this.isUploading) return; // Prevent multiple submissions

    try {
      this.isUploading = true; // STEP 1: Show loading state
      console.log('[ImagePost] createPost initiated. Caption:', this.caption);
      let imageUrl: string | null = this.imagePreview; // Fallback to current preview (could be base64 if no file)

      // ISSUE 2 FIX: If a file was selected from device, upload it to Storage instead of using Base64
      if (this.selectedFile) {
        console.log('[ImagePost] Starting document creation...');
        console.log('[ImagePost] Image file selected, beginning upload sequence...');
        imageUrl = await this.postService.uploadImage(this.selectedFile);
        if (!imageUrl) {
          throw new Error('Upload returned empty URL. Check Firebase Storage permissions.');
        }
        console.log('[ImagePost] Upload successful! Storage URL:', imageUrl);
      } else {
        console.log('[ImagePost] No selectedFile, using preview/base64 fallback');
      }

      if (!imageUrl) {
        console.error('[ImagePost] Validation failed: No imageUrl found');
        alert('Please select an image first.');
        this.isUploading = false; // Reset loading state on validation failure
        return;
      }

      const communityName = this.authService.getCommunityName() || 'Innera Platform';
      const userName = localStorage.getItem('userName') || 'Anonymous';
      const userEmail = localStorage.getItem('userEmail') || '';
      const userRole = localStorage.getItem('userRole') || 'user';

      console.log('[ImagePost] Finalizing post creation for community:', communityName);

      // STEP 7: Extract hashtags automatically from caption
      const hashtagRegex = /#\w+/g;
      const tags = this.caption.match(hashtagRegex) || [];

      console.log('[ImagePost] Pre-creation check: role/context ok. Community:', communityName);
      // Attempt to create the post document in Firestore
      const postId = await this.postService.createPost({
        author: userName,
        avatar: userName.charAt(0).toUpperCase(),
        content: this.caption.trim(),
        tags: tags,
        type: 'image',
        userId: userEmail,
        communityName: communityName,
        imageData: imageUrl, // Now uses the Storage download URL
        authorRole: userRole as 'admin' | 'user'
      });

      console.log('[ImagePost] Created post document ID:', postId);
      console.log('[ImagePost] Waiting for consistency delay (1s)...');

      // ISSUE 6 FIX: Wait 1 second for Firestore to index the new document 
      // before querying it back, ensuring it shows up in history immediately.
      await new Promise(resolve => setTimeout(resolve, 1000));
      // ISSUE 2 FIX: Force refresh of the history list to show the new post
      await this.loadPosts();

      this.resetForm();
      this.isUploading = false; // Reset loading state on success
      this.goBack();
    } catch (error: any) {
      this.isUploading = false; // Reset loading state on error
      console.error('[ImagePost] FATAL creation error:', error);
      alert('Critical error creating post: ' + (error.message || 'Unknown error'));
    }
  }



  resetForm() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.caption = '';
  }

  goBack() {
    this.router.navigate(['/feed']);
  }

  async loadPosts() {
    // ISSUE 2 FIX: Fetch real image posts from Firestore instead of stale localStorage
    try {
      const community = this.authService.getCommunityName();
      if (!community) return;

      const allPosts = await this.postService.getPosts(community);
      // Map Firestore posts to the local ImagePost interface for compatibility
      this.posts = allPosts
        .filter(p => p.type === 'image')
        .map(p => ({
          id: parseInt(p.id.substring(0, 8), 16) || Date.now(), // Fallback ID for local UI
          imageData: p.imageData || '',
          caption: p.content,
          author: p.author,
          createdAt: p.createdAt.toDate().toISOString(),
          updatedAt: p.createdAt.toDate().toISOString()
        }));

      console.log('[ImagePost] Loaded real history from Firestore:', this.posts.length);
    } catch (e) {
      console.error('[ImagePost] Failed to load history:', e);
    }
  }

  savePosts() {
    localStorage.setItem('imagePosts', JSON.stringify(this.posts));
  }

  updateFeedWithNewPost(newPost: ImagePost) {
    // Placeholder for updating feed
    console.log('New post added:', newPost);
  }

  selectPost(post: ImagePost) {
    this.selectedPost = post;
    this.imagePreview = post.imageData;
    this.caption = post.caption;
    this.isEditing = true;
  }

  updatePost() {
    if (!this.selectedPost || !this.imagePreview || !this.caption.trim()) return;

    this.selectedPost.imageData = this.imagePreview;
    this.selectedPost.caption = this.caption.trim();
    this.selectedPost.updatedAt = new Date().toISOString();

    this.savePosts();
    this.resetForm();
    this.isEditing = false;
    this.selectedPost = null;
  }

  deletePost() {
    if (!this.selectedPost) return;

    this.posts = this.posts.filter(p => p.id !== this.selectedPost!.id);
    this.savePosts();
    this.resetForm();
    this.isEditing = false;
    this.selectedPost = null;
  }
}
