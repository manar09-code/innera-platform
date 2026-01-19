import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, onSnapshot, Timestamp, collectionGroup } from 'firebase/firestore';
import { firestore } from '../firebase.config';

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
  time: Timestamp;
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

  constructor() { }

  // Create a new post
  async createPost(postData: Omit<Post, 'id' | 'time' | 'likes' | 'comments' | 'likedBy'>): Promise<string> {
    try {
      const postsRef = collection(firestore, 'posts');
      const docRef = await addDoc(postsRef, {
        ...postData,
        time: Timestamp.now(),
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
      const q = query(postsRef, where('communityName', '==', communityName));
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      for (const docSnap of querySnapshot.docs) {
        const postData = docSnap.data() as Omit<Post, 'id'>;
        posts.push({
          id: docSnap.id,
          ...postData,
          time: postData.time as Timestamp
        });
      }
      // Sort posts by time descending
      posts.sort((a, b) => b.time.toMillis() - a.time.toMillis());
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

  // Listen to real-time updates for posts
  listenToPosts(communityName: string, callback: (posts: Post[]) => void): () => void {
    const postsRef = collection(firestore, 'posts');
    const q = query(postsRef, where('communityName', '==', communityName));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const postData = doc.data() as Omit<Post, 'id'>;
        posts.push({
          id: doc.id,
          ...postData,
          time: postData.time as Timestamp
        });
      });
      // Sort posts by time descending
      posts.sort((a, b) => b.time.toMillis() - a.time.toMillis());
      callback(posts);
    });
    return unsubscribe;
  }

  // Listen to real-time updates for comments on a post
  listenToComments(postId: string, callback: (comments: Comment[]) => void): () => void {
    const commentsRef = collection(firestore, 'posts', postId, 'comments');
    const q = query(commentsRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      callback(comments);
    });
    return unsubscribe;
  }
  // Get posts authored by a specific user
  async getUserPosts(userEmail: string): Promise<Post[]> {
    try {
      const postsRef = collection(firestore, 'posts');
      const q = query(postsRef, where('userId', '==', userEmail));
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const postData = doc.data() as Omit<Post, 'id'>;
        posts.push({ id: doc.id, ...postData, time: postData.time as Timestamp });
      });
      return posts.sort((a, b) => b.time.toMillis() - a.time.toMillis());
    } catch (error) {
      console.error("Error getting user posts:", error);
      return [];
    }
  }

  // Get posts liked by user
  async getUserLikedPosts(username: string): Promise<Post[]> {
    try {
      const postsRef = collection(firestore, 'posts');
      const q = query(postsRef, where('likedBy', 'array-contains', username));
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const postData = doc.data() as Omit<Post, 'id'>;
        posts.push({ id: doc.id, ...postData, time: postData.time as Timestamp });
      });
      return posts;
    } catch (error) {
      console.error("Error getting liked posts:", error);
      return [];
    }
  }

  // Get comments by user
  async getUserComments(userId: string): Promise<Comment[]> {
    try {
      const q = query(collectionGroup(firestore, 'comments'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Comment, 'id'>;
        comments.push({ id: doc.id, ...data, time: data.time as Timestamp });
      });
      return comments.sort((a, b) => b.time.toMillis() - a.time.toMillis());
    } catch (error) {
      console.error("Error getting user comments:", error);
      // NOTE: This might require an index error in console, link provided by Firebase must be clicked
      return [];
    }
  }

  // Get all stats
  async getCommunityStats(communityName: string): Promise<any> {
    try {
      const postsRef = collection(firestore, 'posts');
      const q = query(postsRef, where('communityName', '==', communityName));
      const snapshot = await getDocs(q);

      let totalPosts = 0;
      let totalImagePosts = 0;
      let totalTextPosts = 0;
      let totalLikes = 0;
      let totalComments = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalPosts++;
        if (data['type'] === 'image') totalImagePosts++;
        else totalTextPosts++;

        totalLikes += (data['likes'] || 0);
        totalComments += (data['commentCount'] || 0); // Use the new field
      });

      return {
        totalPosts,
        totalImagePosts,
        totalTextPosts,
        totalLikes,
        totalComments
      };
    } catch (e) {
      console.error(e);
      return { totalPosts: 0, totalImagePosts: 0, totalTextPosts: 0, totalLikes: 0, totalComments: 0 };
    }
  }
}
