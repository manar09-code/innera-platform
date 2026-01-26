import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, onSnapshot, Timestamp, collectionGroup, orderBy } from 'firebase/firestore';
import { firestore, storage } from '../firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Comment {
  id: string;
  username: string;
  text: string;
  time: Timestamp;
  userId: string;
  parentId?: string;
  communityName: string;
  replies?: Comment[];
}

export interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: Timestamp;
  likes: number;
  comments: Comment[];
  tags: string[];
  type: string;
  likedBy: string[];
  imageData?: string;
  isPinned?: boolean;
  userId: string;
  communityName: string;
  authorRole: 'admin' | 'user';
  commentCount?: number; // Added to track count for stats
}

@Injectable({
  providedIn: 'root'
})
export class PostService {

  // ISSUE 6 FIX: Robust normalization replacing hyphens/underscores with spaces
  private normalizeCommunityName(name: string): string {
    if (!name) return '';
    return name
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, ' '); // Unify "tunisia-hood" and "tunisia hood"
  }

  // Helper to get Timestamp from various possible fields (createdAt, time)
  private getPostTimestamp(data: any): Timestamp {
    if (data.createdAt && data.createdAt.toMillis) return data.createdAt;
    if (data.time && data.time.toMillis) return data.time;

    // Fallback if it's already a Date or partial object
    if (data.createdAt?.seconds) return new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds || 0);
    if (data.time?.seconds) return new Timestamp(data.time.seconds, data.time.nanoseconds || 0);

    return Timestamp.now(); // Final fallback
  }

  constructor() { }

  // ISSUE 2 FIX: Helper to upload image to Firebase Storage
  async uploadImage(file: File): Promise<string> {
    try {
      console.log('[PostService] Starting image upload for file:', file.name);

      // Check for valid storage bucket references
      if (!storage) {
        throw new Error('Firebase Storage not initialized. Please check firebase.config.ts');
      }

      const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);

      console.log('[PostService] Upload successful, getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('[PostService] Download URL obtained:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('[PostService] Error uploading image to Storage:', error);
      // Log specific error codes if available
      if (error.code === 'storage/unauthorized') {
        throw new Error('Upload failed: Unauthorized. Check Firebase Storage rules.');
      }
      throw error;
    }
  }

  // ISSUE 3 & Real-time: Listen to stats for a community
  listenToCommunityStats(communityName: string, callback: (stats: any) => void): () => void {
    return this.listenToPosts(communityName, (posts) => {
      const stats = this.calculateCommunityStats(posts);
      callback(stats);
    });
  }

  // ISSUE 3: Get one-shot stats for a community (Grounding for AI)
  async getCommunityStats(communityName: string): Promise<any> {
    try {
      const normalized = this.normalizeCommunityName(communityName);
      const posts = await this.getPosts(normalized);
      return this.calculateCommunityStats(posts);
    } catch (e) {
      console.error('[PostService] Error getting community stats:', e);
      return { totalPosts: 0, totalLikes: 0, totalComments: 0, mostActiveAuthor: { name: 'N/A', postCount: 0 } };
    }
  }

  private calculateCommunityStats(posts: Post[]): any {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.commentCount || (post.comments?.length || 0)), 0);

    const totalImagePosts = posts.filter(p => p.type === 'image').length;
    const totalTextPosts = posts.filter(p => p.type === 'text').length;

    const authorActivity = new Map<string, number>();
    posts.forEach(post => {
      authorActivity.set(post.author, (authorActivity.get(post.author) || 0) + 1);
    });
    let mostActiveAuthor = { name: 'N/A', postCount: 0 };
    if (authorActivity.size > 0) {
      const sortedAuthors = Array.from(authorActivity.entries()).sort((a, b) => b[1] - a[1]);
      mostActiveAuthor = { name: sortedAuthors[0][0], postCount: sortedAuthors[0][1] };
    }

    return {
      totalPosts,
      totalLikes,
      totalComments,
      totalImagePosts,
      totalTextPosts,
      mostActiveAuthor
    };
  }

  // ISSUE 3: Get top 5 most liked/commented posts
  async getPopularPosts(communityName: string): Promise<Post[]> {
    try {
      // ISSUE 6: Normalize community name for consistent querying
      const normalized = this.normalizeCommunityName(communityName);
      const posts = await this.getPosts(normalized);
      return posts
        .sort((a, b) => ((b.likes || 0) + (b.comments?.length || 0)) - ((a.likes || 0) + (a.comments?.length || 0)))
        .slice(0, 5);
    } catch (e) {
      console.error('[PostService] Error getting popular posts:', e);
      return [];
    }
  }

  // ISSUE 3: Get top 5 most active authors
  async getActiveAuthors(communityName: string): Promise<any[]> {
    try {
      // ISSUE 6: Normalize community name for consistent querying
      const normalized = this.normalizeCommunityName(communityName);
      const posts = await this.getPosts(normalized);
      const authorMap = new Map<string, { count: number, avatar: string }>();

      posts.forEach(p => {
        const stats = authorMap.get(p.author) || { count: 0, avatar: p.avatar || '👤' };
        stats.count++;
        authorMap.set(p.author, stats);
      });

      return Array.from(authorMap.entries())
        .map(([name, stats]) => ({ name, count: stats.count, avatar: stats.avatar }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (e) {
      console.error('[PostService] Error getting active authors:', e);
      return [];
    }
  }

  // Create a new post
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'likedBy'>): Promise<string> {
    try {
      const postsRef = collection(firestore, 'posts');

      // ISSUE 6: Normalize community name before storage
      const normalizedComm = this.normalizeCommunityName(postData.communityName);

      const docRef = await addDoc(postsRef, {
        ...postData,
        communityName: normalizedComm,
        createdAt: Timestamp.now(),
        likes: 0,
        comments: [],
        likedBy: [],
        commentCount: 0
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Get all posts for a community
  async getPosts(communityName: string): Promise<Post[]> {
    try {
      const postsRef = collection(firestore, 'posts');
      const normalized = this.normalizeCommunityName(communityName);
      const variations = [normalized];
      const hyphenated = normalized.replace(/\s+/g, '-');
      if (hyphenated !== normalized) variations.push(hyphenated);
      const capitalized = normalized.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (capitalized !== normalized && !variations.includes(capitalized)) variations.push(capitalized);
      const firstCap = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      if (firstCap !== normalized && !variations.includes(firstCap)) variations.push(firstCap);
      const allCaps = normalized.toUpperCase();
      if (allCaps !== normalized && !variations.includes(allCaps)) variations.push(allCaps);

      const q = query(postsRef, where('communityName', 'in', variations));
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      for (const docSnap of querySnapshot.docs) {
        const postData = docSnap.data();
        posts.push({
          id: docSnap.id,
          ...postData,
          createdAt: this.getPostTimestamp(postData)
        } as Post);
      }
      // Sort posts by createdAt descending
      posts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      return posts;
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  // Update a post
  async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
    try {
      const postRef = doc(firestore, 'posts', postId);
      await updateDoc(postRef, updates);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete a post
  async deletePost(postId: string): Promise<void> {
    try {
      const postRef = doc(firestore, 'posts', postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Add a comment to a post
  async addComment(postId: string, commentData: Omit<Comment, 'id' | 'time'>, parentId?: string): Promise<string> {
    try {
      const commentsRef = collection(firestore, 'posts', postId, 'comments');
      const docRef = await addDoc(commentsRef, {
        ...commentData,
        parentId: parentId || null,
        time: Timestamp.now()
      });

      // Update comment count on post
      const postRef = doc(firestore, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCount = postSnap.data()['commentCount'] || 0;
        await updateDoc(postRef, { commentCount: currentCount + 1 });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get comments for a post
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(firestore, 'posts', postId, 'comments');
      const q = query(commentsRef);
      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const commentData = doc.data() as Omit<Comment, 'id'>;
        comments.push({
          id: doc.id,
          ...commentData,
          time: commentData.time as Timestamp
        });
      });
      // Sort comments by time ascending
      comments.sort((a, b) => a.time.toMillis() - b.time.toMillis());
      return comments;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // Like/Unlike a post
  async toggleLike(postId: string, userId: string, userName: string): Promise<void> {
    try {
      const postRef = doc(firestore, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data() as Post;
        const likedBy = postData.likedBy || [];
        const index = likedBy.indexOf(userName);
        let newLikes = postData.likes;
        if (index === -1) {
          likedBy.push(userName);
          newLikes++;
        } else {
          likedBy.splice(index, 1);
          newLikes--;
        }
        await updateDoc(postRef, {
          likedBy: likedBy,
          likes: newLikes
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  listenToPosts(communityName: string, callback: (posts: Post[]) => void): () => void {
    const postsRef = collection(firestore, 'posts');
    // ISSUE 10: Use normalization
    const normalized = this.normalizeCommunityName(communityName);

    // Create variations to "bring back" posts
    const variations = [normalized];

    // Hyphenated version (e.g. "tunisia-hood")
    const hyphenated = normalized.replace(/\s+/g, '-');
    if (hyphenated !== normalized) variations.push(hyphenated);

    // Capitalized version (e.g. "Tunisia Hood")
    const capitalized = normalized.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (capitalized !== normalized && !variations.includes(capitalized)) variations.push(capitalized);

    // First-letter capitalized only (e.g. "Tunisia hood")
    const firstCap = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    if (firstCap !== normalized && !variations.includes(firstCap)) variations.push(firstCap);

    // ALL CAPS version (e.g. "TUNISIA HOOD")
    const allCaps = normalized.toUpperCase();
    if (allCaps !== normalized && !variations.includes(allCaps)) variations.push(allCaps);

    console.log(`[PostService] Listening to posts with robust variations:`, variations);

    const q = query(
      postsRef,
      where('communityName', 'in', variations)
    );
    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const posts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const postData = doc.data();
          posts.push({
            id: doc.id,
            ...postData,
            createdAt: this.getPostTimestamp(postData)
          } as Post);
        });
        // Sort posts by createdAt descending
        posts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        callback(posts);
      },
      (error) => {
        console.error('[PostService] Error in listenToPosts onSnapshot:', error);
      }
    );
    return unsubscribe;
  }

  listenToComments(postId: string, callback: (comments: Comment[]) => void): () => void {
    const commentsRef = collection(firestore, 'posts', postId, 'comments');
    const q = query(commentsRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const commentData = doc.data() as any;
        comments.push({
          id: doc.id,
          ...commentData,
          time: (commentData.time && typeof commentData.time.toMillis === 'function')
            ? commentData.time
            : Timestamp.now()
        });
      });
      // Sort comments by time ascending
      comments.sort((a, b) => a.time.toMillis() - b.time.toMillis());
      callback(comments);
    });
    return unsubscribe;
  }
  // Listen to posts authored by a specific user
  listenToUserPosts(userEmail: string, callback: (posts: Post[]) => void): () => void {
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, where('userId', '==', userEmail));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.getPostTimestamp(doc.data())
      } as Post));
      callback(posts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    }, (error) => console.error('[PostService] listenToUserPosts error:', error));
  }

  // Listen to posts liked by user
  listenToUserLikedPosts(username: string, callback: (posts: Post[]) => void): () => void {
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, where('likedBy', 'array-contains', username));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.getPostTimestamp(doc.data())
      } as Post));
      callback(posts);
    }, (error) => console.error('[PostService] listenToUserLikedPosts error:', error));
  }

  // Listen to comments by user
  listenToUserComments(userId: string, callback: (comments: Comment[]) => void): () => void {
    const q = query(collectionGroup(firestore, 'comments'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: (doc.data() as any).time as Timestamp
      } as Comment));
      callback(comments.sort((a, b) => b.time.toMillis() - a.time.toMillis()));
    }, (error) => console.error('[PostService] listenToUserComments error:', error));
  }

  // One-shot Fetchers for recovery/initialization logic
  async getUserPosts(userEmail: string): Promise<Post[]> {
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, where('userId', '==', userEmail));
    const snap = await getDocs(q);
    const posts = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.getPostTimestamp(doc.data())
    } as Post));
    return posts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }

  async getUserLikedPosts(username: string): Promise<Post[]> {
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, where('likedBy', 'array-contains', username));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: this.getPostTimestamp(doc.data())
    } as Post));
  }

  async getUserComments(userId: string): Promise<Comment[]> {
    const q = query(collectionGroup(firestore, 'comments'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const comments = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      time: (doc.data() as any).time as Timestamp
    } as Comment));
    return comments.sort((a, b) => b.time.toMillis() - a.time.toMillis());
  }
}
