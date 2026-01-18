import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase.config';

interface UserData {
  username?: string;
  adminName?: string;
  email: string;
  communityName: string;
  role: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private communityName: string = '';
  private currentUser: FirebaseUser | null = null;

  constructor() {
    // Listen to authentication state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.loadUserData(user.uid);
      } else {
        this.clearUserData();
      }
    });
  }

  private async loadUserData(uid: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.username || userData.adminName || '');
        this.setCommunityName(userData.communityName);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  private clearUserData(): void {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('communityName');
    this.communityName = '';
  }

  async registerUser(username: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user data in Firestore
      const userData: UserData = {
        username,
        email,
        communityName,
        role: 'user'
      };

      await setDoc(doc(firestore, 'users', user.uid), userData);

      // Set local storage
      localStorage.setItem('userRole', 'user');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', username);
      this.setCommunityName(communityName);

      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async registerAdmin(adminName: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional admin data in Firestore
      const adminData: UserData = {
        adminName,
        email,
        communityName,
        role: 'admin'
      };

      await setDoc(doc(firestore, 'users', user.uid), adminData);

      // Set local storage
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', adminName);
      this.setCommunityName(communityName);

      return { success: true };
    } catch (error: any) {
      console.error('Admin registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginUser(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify community name matches
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        if (userData.communityName !== communityName || userData.role !== 'user') {
          await signOut(auth);
          return { success: false, error: 'Invalid credentials or community name' };
        }

        // Set local storage
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', userData.username || '');
        this.setCommunityName(communityName);

        return { success: true };
      } else {
        await signOut(auth);
        return { success: false, error: 'User data not found' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginAdmin(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify community name matches and role is admin
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        if (userData.communityName !== communityName || userData.role !== 'admin') {
          await signOut(auth);
          return { success: false, error: 'Invalid credentials or community name' };
        }

        // Set local storage
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', userData.adminName || '');
        this.setCommunityName(communityName);

        return { success: true };
      } else {
        await signOut(auth);
        return { success: false, error: 'Admin data not found' };
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message };
    }
  }

  setCommunityName(name: string): void {
    this.communityName = name;
    localStorage.setItem('communityName', name);
  }

  getCommunityName(): string {
    if (!this.communityName) {
      this.communityName = localStorage.getItem('communityName') || '';
    }
    return this.communityName;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && !!localStorage.getItem('userRole');
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.clearUserData();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getAdminNameForCommunity(communityName: string): Promise<string> {
    try {
      // Query Firestore for admin with matching community name
      // Note: This is a simplified implementation. In a real app, you might want to use a more efficient query
      const usersRef = doc(firestore, 'users'); // This would need to be a collection query
      // For now, return a placeholder
      return 'Community Admin';
    } catch (error) {
      console.error('Error getting admin name:', error);
      return 'Unknown Admin';
    }
  }

  getRegisteredUsers(): any[] {
    const stored = localStorage.getItem('registeredUsers');
    return stored ? JSON.parse(stored) : [];
  }

  setRegisteredUsers(users: any[]): void {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  }

  getRegisteredAdmins(): any[] {
    const stored = localStorage.getItem('registeredAdmins');
    return stored ? JSON.parse(stored) : [];
  }

  setRegisteredAdmins(admins: any[]): void {
    localStorage.setItem('registeredAdmins', JSON.stringify(admins));
  }
}
