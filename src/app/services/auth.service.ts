import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Firestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase.config';
import { WebhookService } from './webhook.service';

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

  constructor(private webhookService: WebhookService) {
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

      // Trigger automation webhook
      this.triggerAutomation('userRegistration', { email, name: username, userId: user.uid });

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

      // Trigger automation webhook
      this.triggerAutomation('userRegistration', { email, name: adminName, userId: user.uid });

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

        // Trigger automation webhook
        this.triggerAutomation('userLogin', { email, name: userData.username || '' });

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

        // Trigger automation webhook
        this.triggerAutomation('userLogin', { email, name: userData.adminName || '' });

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

  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  // Automation hooks for Make AI webhooks
  private triggerAutomation(event: string, data: any) {
    const { email, name, userId } = data;
    switch (event) {
      case 'userRegistration':
        this.webhookService.triggerUserRegistration(email, name, userId);
        break;
      case 'userLogin':
        this.webhookService.triggerUserLogin(email, name);
        break;
      case 'profileUpdate':
        this.webhookService.triggerProfileUpdate(email, name, userId, data.changes);
        break;
      default:
        console.warn(`Unknown automation event: ${event}`);
    }
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
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('communityName', '==', communityName), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const adminData = adminDoc.data() as UserData;
        return adminData.adminName || 'Community Admin';
      } else {
        return 'Community Admin';
      }
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

  // Listen to real-time updates for members count in "tunisia hood" community
  listenToMembersCount(callback: (count: number) => void): () => void {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('communityName', '==', this.getCommunityName()));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      callback(querySnapshot.size);
    });
    return unsubscribe;
  }

  // Get all members for current community
  async getMembers(): Promise<any[]> {
    const communityName = this.getCommunityName();
    if (!communityName) return [];

    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('communityName', '==', communityName));
      const querySnapshot = await getDocs(usersRef); // Actually we should filter by community, but simpler query might be safer if index missing
      // Let's use client side filtering if index issues arise, but try query first.
      // Correction: querySnapshot above used usersRef without q. Fix:
      const q2 = query(usersRef, where('communityName', '==', communityName));
      const snapshot = await getDocs(q2);

      const members: any[] = [];
      snapshot.forEach(doc => {
        members.push({ id: doc.id, ...doc.data() });
      });
      return members;
    } catch (error) {
      console.error("Error fetching members:", error);
      return [];
    }
  }

  // Toggle block status
  async toggleBlockUser(uid: string, currentStatus: boolean): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'users', uid), {
        isBlocked: !currentStatus
      });
    } catch (e) {
      console.error("Error blocking user:", e);
      throw e;
    }
  }

  // Delete user (firestore data only, auth deletion requires cloud function usually)
  async deleteUser(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, 'users', uid));
    } catch (e) {
      console.error("Error deleting user:", e);
      throw e;
    }
  }

  // Update user profile in Firestore and trigger webhook
  async updateUserProfile(field: string, value: string): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data() as UserData;
      const currentRole = localStorage.getItem('userRole');
      const currentEmail = localStorage.getItem('userEmail') || '';
      const currentName = localStorage.getItem('userName') || '';

      // Map field names for admin vs user
      const actualField = currentRole === 'admin' && field === 'username' ? 'adminName' : field;

      // Update Firestore
      await updateDoc(userDocRef, {
        [actualField]: value
      });

      // Update local storage
      if (field === 'username' || field === 'adminName') {
        localStorage.setItem('userName', value);
      } else if (field === 'email') {
        localStorage.setItem('userEmail', value);
      } else if (field === 'communityName') {
        this.setCommunityName(value);
      }

      // Trigger automation webhook for profile update
      this.triggerAutomation('profileUpdate', {
        email: currentEmail,
        name: currentName,
        userId: currentUser.uid,
        changes: { [actualField]: value }
      });

    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}
