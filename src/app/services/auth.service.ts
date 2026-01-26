// Cleaned up AuthService
import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Firestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase.config';
import { WebhookService } from './webhook.service';
import { BehaviorSubject, Observable } from 'rxjs';

interface UserData {
  id: string;
  username?: string;
  adminName?: string;
  email: string;
  communityName: string;
  role: 'user' | 'admin';
  isBlocked?: boolean;
  loginCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private communityName: string = '';
  private activeProfileId: string = '';

  private communityNameSubject = new BehaviorSubject<string>('');
  public communityName$: Observable<string> = this.communityNameSubject.asObservable();

  private userRoleSubject: BehaviorSubject<string>;
  public userRole$: Observable<string>;

  private userNameSubject: BehaviorSubject<string>;
  public userName$: Observable<string>;

  private currentUser: FirebaseUser | null = null;
  public isInitialized: Promise<void>;
  private resolveInit!: () => void;

  private normalizeCommunityName(name: string): string {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/[-_]/g, ' ');
  }

  constructor(private webhookService: WebhookService) { // This line defines the constructor for the AuthService class, which takes a WebhookService instance as a parameter for dependency injection, used to trigger webhooks.
    // Initialize subjects from localStorage immediately to prevent UI flickering
    const storedRole = localStorage.getItem('userRole') || '';
    const storedName = localStorage.getItem('userName') || '';
    const rawComm = localStorage.getItem('communityName') || '';

    this.userRoleSubject = new BehaviorSubject<string>(storedRole || 'user'); // Fallback to 'user' to ensure navbar visibility
    this.userRole$ = this.userRoleSubject.asObservable();
    this.userNameSubject = new BehaviorSubject<string>(storedName || 'Guest');
    this.userName$ = this.userNameSubject.asObservable();
    this.communityName = this.normalizeCommunityName(rawComm);
    this.communityNameSubject = new BehaviorSubject<string>(this.communityName);
    this.communityName$ = this.communityNameSubject.asObservable();

    // Create the initialization promise
    this.isInitialized = new Promise((resolve) => {
      this.resolveInit = resolve;
    });

    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserData(user.uid);
      } else {
        this.clearUserData();
      }
      this.resolveInit();
    });
  }

  private async loadUserData(uid: string): Promise<void> {
    try {
      const storedRole = localStorage.getItem('userRole');
      const storedCommunity = localStorage.getItem('communityName');

      let profileId = uid;
      if (storedRole && storedCommunity) {
        profileId = `${uid}_${storedRole}_${storedCommunity}`;
      }

      console.log(`[AuthService] Attempting to load profile: ${profileId}`);
      const userDoc = await getDoc(doc(firestore, 'users', profileId));

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        this.activeProfileId = profileId;
        const role = userData.role;
        const name = userData.username || userData.adminName || '';

        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', name);

        this.userRoleSubject.next(role);
        this.userNameSubject.next(name);
        this.setCommunityName(userData.communityName);
      } else {
        const q = query(collection(firestore, 'users'), where('id', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as UserData;
          this.activeProfileId = querySnapshot.docs[0].id;
          const role = userData.role;
          const name = userData.username || userData.adminName || '';

          this.setCommunityName(userData.communityName);
          localStorage.setItem('userRole', role);
          localStorage.setItem('userEmail', userData.email);
          localStorage.setItem('userName', name);

          this.userRoleSubject.next(role);
          this.userNameSubject.next(name);
        } else {
          this.clearUserData();
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  private clearUserData(): void {
    const email = localStorage.getItem('userEmail');
    if (email) {
      sessionStorage.removeItem(`welcome_card_hidden_${email}`);
    }

    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('communityName');

    this.communityName = '';
    this.activeProfileId = '';
    this.userRoleSubject.next('');
    this.userNameSubject.next('');
    this.communityNameSubject.next('');
  }

  async registerUser(username: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedComm = this.normalizeCommunityName(communityName);
      let user: FirebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          const signInResult = await signInWithEmailAndPassword(auth, email, password);
          user = signInResult.user;
        } else {
          throw authError;
        }
      }

      const profileId = `${user.uid}_user_${normalizedComm}`;
      const userData: UserData = {
        id: user.uid,
        username,
        email,
        communityName: normalizedComm,
        role: 'user'
      };
      await setDoc(doc(firestore, 'users', profileId), userData);

      localStorage.setItem('userRole', 'user');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', username);
      this.setCommunityName(normalizedComm);
      this.activeProfileId = profileId;

      this.webhookService.triggerUserRegistration(email, username, user.uid);
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async registerAdmin(adminName: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedComm = this.normalizeCommunityName(communityName);
      let user: FirebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          const signInResult = await signInWithEmailAndPassword(auth, email, password);
          user = signInResult.user;
        } else {
          throw authError;
        }
      }

      const profileId = `${user.uid}_admin_${normalizedComm}`;
      const adminData: UserData = {
        id: user.uid,
        adminName,
        email,
        communityName: normalizedComm,
        role: 'admin'
      };
      await setDoc(doc(firestore, 'users', profileId), adminData);

      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', adminName);
      this.setCommunityName(normalizedComm);
      this.activeProfileId = profileId;

      this.webhookService.triggerUserRegistration(email, adminName, user.uid);
      return { success: true };
    } catch (error: any) {
      console.error('Admin registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginUser(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    this.clearUserData();
    try {
      const normalizedComm = this.normalizeCommunityName(communityName);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const q = query(collection(firestore, 'users'), where('id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs.find(d => d.data()['role'] === 'user');

      if (userDoc) {
        const userData = userDoc.data() as UserData;
        const userComm = userData.communityName ? userData.communityName.toLowerCase().trim() : '';
        const inputComm = normalizedComm.toLowerCase().trim();

        if (userComm !== inputComm) {
          await signOut(auth);
          return { success: false, error: 'Invalid community name for this account.' };
        }

        const profileId = userDoc.id;
        this.activeProfileId = profileId;
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', userData.username || '');

        // ISSUE 8 FIX: Use the community name from the DB if it exists, fallback to form input
        const resolvedComm = userData.communityName || normalizedComm;
        this.setCommunityName(resolvedComm);

        // Ensure welcome card shows for new login
        sessionStorage.removeItem(`welcome_card_hidden_${email}`);

        try {
          const userRef = doc(firestore, 'users', profileId);
          await updateDoc(userRef, { loginCount: (userData.loginCount || 0) + 1 });
        } catch (e) { console.error('[AuthService] Silent loginCount update fail:', e); }

        this.webhookService.triggerUserLogin(email, userData.username || '');
        return { success: true };
      } else {
        await signOut(auth);
        return { success: false, error: 'User profile not found.' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginAdmin(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    this.clearUserData();
    try {
      const normalizedComm = this.normalizeCommunityName(communityName);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log(`[AuthService] Querying admin for UID: ${user.uid}`);
      const q = query(collection(firestore, 'users'), where('id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const adminDoc = querySnapshot.docs.find(d => d.data()['role'] === 'admin');

      if (adminDoc) {
        const userData = adminDoc.data() as UserData;

        const userComm = userData.communityName ? userData.communityName.toLowerCase().trim() : '';
        const inputComm = normalizedComm.toLowerCase().trim();

        if (userComm !== inputComm) {
          await signOut(auth);
          return { success: false, error: 'Invalid community name for this account.' };
        }

        const profileId = adminDoc.id;
        this.activeProfileId = profileId;
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', userData.adminName || '');

        // ISSUE 8 FIX: Use the community name from the DB if it exists, fallback to form input
        const resolvedComm = userData.communityName || normalizedComm;
        this.setCommunityName(resolvedComm);

        // Ensure welcome card shows for new login
        sessionStorage.removeItem(`welcome_card_hidden_${email}`);

        try {
          const userRef = doc(firestore, 'users', profileId);
          await updateDoc(userRef, { loginCount: (userData.loginCount || 0) + 1 });
        } catch (e) { console.error('[AuthService] Silent loginCount update fail:', e); }

        this.webhookService.triggerUserLogin(email, userData.adminName || '');
        return { success: true };
      } else {
        await signOut(auth);
        return { success: false, error: 'Admin permissions not found.' };
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message };
    }
  }

  setCommunityName(name: string): void {
    const normalized = this.normalizeCommunityName(name);
    this.communityName = normalized;
    localStorage.setItem('communityName', normalized);
    this.communityNameSubject.next(normalized);
  }

  getCommunityName(): string {
    if (!this.communityName) {
      const raw = localStorage.getItem('communityName') || '';
      this.communityName = this.normalizeCommunityName(raw);
    }
    return this.communityName;
  }

  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  async updateUserProfile(field: string, value: string): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');
    try {
      const targetId = this.activeProfileId || this.currentUser.uid;
      const userDocRef = doc(firestore, 'users', targetId);
      const updateData: Partial<UserData> = {};
      if (field === 'username') {
        updateData.username = value;
        localStorage.setItem('userName', value);
      } else if (field === 'email') {
        updateData.email = value;
        localStorage.setItem('userEmail', value);
      } else if (field === 'communityName') {
        const normalized = this.normalizeCommunityName(value);
        updateData.communityName = normalized;
        this.setCommunityName(normalized);
      }
      await updateDoc(userDocRef, updateData);
      const userName = localStorage.getItem('userName') || 'User';
      this.webhookService.triggerProfileUpdate(this.currentUser.email || '', userName, this.currentUser.uid, updateData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  logout(): void {
    signOut(auth).then(() => {
      this.clearUserData();
    }).catch((error) => console.error('Error signing out:', error));
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  listenToMembersCount(callback: (count: number) => void): (() => void) | null {
    const comm = this.getCommunityName();
    if (!comm) return null;
    const q = query(collection(firestore, 'users'), where('communityName', '==', comm));
    return onSnapshot(q, (snap) => callback(snap.size));
  }

  async getAdminNameForCommunity(communityName: string): Promise<string> {
    try {
      const norm = this.normalizeCommunityName(communityName);
      const q = query(collection(firestore, 'users'), where('communityName', '==', norm), where('role', '==', 'admin'));
      const snap = await getDocs(q);
      if (!snap.empty) return (snap.docs[0].data() as UserData).adminName || 'Admin';
      return 'Admin';
    } catch (e) { return 'Admin'; }
  }

  async getMembers(): Promise<UserData[]> {
    const comm = this.getCommunityName();
    if (!comm) return [];
    try {
      const q = query(collection(firestore, 'users'), where('communityName', '==', comm));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...(d.data() as UserData), id: d.id }));
    } catch (e) { return []; }
  }

  listenToMembers(callback: (members: UserData[]) => void): (() => void) | null {
    const comm = this.getCommunityName();
    if (!comm) return null;
    const q = query(collection(firestore, 'users'), where('communityName', '==', comm));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...(d.data() as UserData), id: d.id })));
    });
  }

  async deleteUser(uid: string): Promise<void> {
    try { await deleteDoc(doc(firestore, 'users', uid)); }
    catch (e) { console.error(e); throw e; }
  }

  async toggleBlockUser(uid: string, isBlocked: boolean): Promise<void> {
    try { await updateDoc(doc(firestore, 'users', uid), { isBlocked }); }
    catch (e) { console.error(e); throw e; }
  }
}
