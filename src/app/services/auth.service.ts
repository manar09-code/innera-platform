// This file is located in the src/app/services folder, which contains service files that provide reusable functionality across the application, such as authentication, data management, and external integrations. This file serves as the authentication service. Its role is to handle user authentication, registration, login, logout, and user data management using Firebase Auth and Firestore. It interacts with Firebase for authentication and database operations, WebhookService for triggering external automations, and other parts of the app like components and guards for user management.
// Import Angular's Injectable decorator to make this a service that can be injected into components
import { Injectable } from '@angular/core'; // This line imports the Injectable decorator from '@angular/core', which is needed to mark this class as a service that can be injected into other components and services.
// Import Firebase Auth functions for user authentication (register, login, logout, etc.)
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // This line imports various Firebase Auth functions and types from the 'firebase/auth' module, which are needed for user authentication operations like registration, login, logout, and listening to auth state changes.
// Import Firestore functions for database operations (read, write, update, delete documents)
import { Firestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'; // This line imports Firestore functions and types from the 'firebase/firestore' module, which are needed for database operations like reading, writing, updating, and deleting documents in the Firestore database.
// Import Firebase instances (auth and firestore) configured in the app
import { auth, firestore } from '../firebase.config'; // This line imports the configured Firebase auth and firestore instances from '../firebase.config', which are needed to perform authentication and database operations using the app's Firebase setup.
import { WebhookService } from './webhook.service'; // This line imports the WebhookService from './webhook.service', which is needed to trigger external automations and webhooks for events like user registration and login.
import { BehaviorSubject, Observable } from 'rxjs'; // ISSUE 5: Reactive state imports

// Interface defining the structure of user data stored in Firestore
interface UserData { // This line defines the UserData interface, which specifies the structure of user data objects stored in Firestore, ensuring type safety and consistency.
  id: string; // This line defines the required id property, which is a string representing the user's unique identifier.
  username?: string; // This line defines the optional username property for regular users, which is a string representing the user's display name.
  adminName?: string; // This line defines the optional adminName property for admin users, which is a string representing the admin's display name.
  email: string; // This line defines the required email property, which is a string representing the user's email address.
  communityName: string; // This line defines the required communityName property, which is a string representing the name of the community the user belongs to.
  role: 'user' | 'admin'; // This line defines the required role property, which is a union type of 'user' or 'admin', indicating the user's role in the system.
  isBlocked?: boolean; // This line defines the optional isBlocked property, which is a boolean indicating if the user is blocked.
} // This closes the UserData interface, completing the definition of the user data structure.

@Injectable({ // This line applies the Injectable decorator to the class, making it a service that can be injected into other components and services, with the providedIn option set to 'root' to make it a singleton service available throughout the app.
  providedIn: 'root', // This line specifies that the service is provided in the root injector, making it a singleton instance available app-wide.
}) // This closes the Injectable decorator configuration.
export class AuthService { // This line exports the AuthService class, which is the main authentication service class that handles user authentication and data management.
  private communityName: string = ''; // This line declares a private property communityName of type string, initialized to an empty string, used to store the current community name.

  // ISSUE 5 & 9: Reactive subjects for core UI state
  private communityNameSubject = new BehaviorSubject<string>('');
  public communityName$: Observable<string> = this.communityNameSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string>(''); // This line declares a private BehaviorSubject for the user's role, allowing components to reactively subscribe to role changes.
  public userRole$: Observable<string> = this.userRoleSubject.asObservable(); // This line exposes the userRoleSubject as an Observable, providing a public stream for user role.

  private userNameSubject = new BehaviorSubject<string>(''); // This line declares a private BehaviorSubject for the user's name, allowing components to reactively subscribe to name changes.
  public userName$: Observable<string> = this.userNameSubject.asObservable(); // This line exposes the userNameSubject as an Observable, providing a public stream for user name.

  private currentUser: FirebaseUser | null = null; // This line declares a private property currentUser of type FirebaseUser or null, initialized to null, used to store the currently authenticated user.

  // ISSUE 4 FIX: Promise to track if Firebase Auth state has been initialized
  public isInitialized: Promise<void>;
  private resolveInit!: () => void;

  // ISSUE 6: Normalize community names to prevent case-sensitive mismatches in Firestore
  private normalizeCommunityName(name: string): string {
    return name ? name.trim().toLowerCase() : '';
  }

  constructor(private webhookService: WebhookService) { // This line defines the constructor for the AuthService class, which takes a WebhookService instance as a parameter for dependency injection, used to trigger webhooks.
    // Create the initialization promise
    this.isInitialized = new Promise((resolve) => {
      this.resolveInit = resolve;
    });

    // Listen to authentication state changes
    onAuthStateChanged(auth, async (user) => { // This line calls the onAuthStateChanged function to listen for changes in the authentication state
      this.currentUser = user;
      if (user) {
        await this.loadUserData(user.uid);
      } else {
        this.clearUserData();
      }

      // Resolve the init promise on first listener hit
      this.resolveInit();
    });
  } // This closes the constructor.

  private async loadUserData(uid: string): Promise<void> { // This line defines the private async loadUserData method, which takes a uid parameter of type string and returns a Promise<void>, used to load user data from Firestore based on the user's UID.
    try { // This line starts a try block to handle potential errors during data loading.
      // ISSUE 4 & 1 FIX: On refresh, we need to know WHICH profile to load (community/role combo)
      // We use the hints stored in localStorage from the last successful login
      const storedRole = localStorage.getItem('userRole');
      const storedCommunity = localStorage.getItem('communityName');

      let profileId = uid;
      if (storedRole && storedCommunity) {
        profileId = `${uid}_${storedRole}_${storedCommunity}`;
      }

      console.log(`[AuthService] Attempting to load profile: ${profileId}`);
      const userDoc = await getDoc(doc(firestore, 'users', profileId));

      if (userDoc.exists()) { // This line checks if the user document exists in Firestore.
        const userData = userDoc.data() as UserData; // This line gets the data from the user document and casts it to the UserData type.
        console.log(`[AuthService] Profile found via ID: ${profileId}`);
        const role = userData.role; // Extract role for clarity and subject update.
        const name = userData.username || userData.adminName || ''; // Extract name for clarity and subject update.

        localStorage.setItem('userRole', role); // This line stores the user's role in local storage.
        localStorage.setItem('userEmail', userData.email); // This line stores the user's email in local storage.
        localStorage.setItem('userName', name); // This line stores the user's name

        this.userRoleSubject.next(role); // ISSUE 5: Emit the user's role to subscribers.
        this.userNameSubject.next(name); // ISSUE 5: Emit the user's name to subscribers.
        this.setCommunityName(userData.communityName); // This line calls the setCommunityName method to set the community name property and local storage.
      } else {
        // ISSUE 6 HARDENING: Document ID fallback.
        // If the reconstructed ID fails (clean F5 with no localStorage), 
        // we query by the 'id' field which stores the UID.
        console.warn(`[AuthService] Profile ${profileId} not found. Running query fallback...`);
        const q = query(collection(firestore, 'users'), where('id', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as UserData;
          console.log(`[AuthService] Profile recovered! Found community: "${userData.communityName}"`);
          const role = userData.role; // Extract role for clarity and subject update.
          const name = userData.username || userData.adminName || ''; // Extract name for clarity and subject update.

          // Restore missing hints to prevent future fallbacks
          // We normalize the community name found in the DB to ensure consistency
          this.setCommunityName(userData.communityName);
          localStorage.setItem('userRole', role);
          localStorage.setItem('userEmail', userData.email);
          localStorage.setItem('userName', name);

          this.userRoleSubject.next(role); // ISSUE 5: Emit the user's role to subscribers.
          this.userNameSubject.next(name); // ISSUE 5: Emit the user's name to subscribers.
        } else {
          console.error(`[AuthService] FATAL: No profile found for UID ${uid} in Firestore.`);
        }
      }
    } catch (error) { // This line starts a catch block to handle any errors that occur during the try block.
      console.error('Error loading user data:', error); // This line logs the error to the console.
    } // This closes the catch block.
  } // This closes the loadUserData method.

  private clearUserData(): void { // This line defines the private clearUserData method, which returns void, used to clear user data from local storage and reset properties.
    localStorage.removeItem('userRole'); // This line removes the 'userRole' item from local storage.
    localStorage.removeItem('userEmail'); // This line removes the 'userEmail' item from local storage.
    localStorage.removeItem('userName'); // This line removes the 'userName' item from local storage.
    localStorage.removeItem('communityName'); // This line removes the 'communityName' item from local storage.
    this.communityName = ''; // This line resets the communityName property to an empty string.
    this.userRoleSubject.next(''); // ISSUE 5: Reset the user role subject.
    this.userNameSubject.next(''); // ISSUE 5: Reset the user name subject.
    this.communityNameSubject.next(''); // ISSUE 5: Reset the community name subject.
  } // This closes the clearUserData method.

  private triggerAutomation(event: string, data: any): void { // This line defines the private triggerAutomation method, which takes event and data parameters and returns void, used to trigger webhooks for various events.
    console.log(`[Automation Triggered] Event: ${event}, Data:`, data); // This line logs the automation trigger to the console.
    // Here you can integrate with external services like Make.com
    // For now, we'll just log the event
  } // This closes the triggerAutomation method.

  async registerUser(username: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Normalize community name to ensure consistency in Firestore
      const normalizedComm = this.normalizeCommunityName(communityName);
      let user: FirebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError: any) {
        // ISSUE 5 FIX: If email already exists, verify password by signing in
        if (authError.code === 'auth/email-already-in-use') {
          const signInResult = await signInWithEmailAndPassword(auth, email, password);
          user = signInResult.user;
        } else {
          throw authError;
        }
      }

      // ISSUE 5: Store profile with a composite ID to allow multi-role/community
      // Use the normalized community name for the profile ID
      const profileId = `${user.uid}_user_${normalizedComm}`;
      const userData: UserData = {
        id: user.uid,
        username,
        email,
        // Use the normalized community name for the user data
        communityName: normalizedComm,
        role: 'user'
      };
      await setDoc(doc(firestore, 'users', profileId), userData);

      // Set session data
      localStorage.setItem('userRole', 'user');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', username);
      // Use the normalized community name for setting the current community
      this.setCommunityName(normalizedComm);

      // ISSUE 1: Trigger registration webhook
      this.webhookService.triggerUserRegistration(email, username, user.uid);

      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async registerAdmin(adminName: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Normalize community name to ensure consistency in Firestore
      const normalizedComm = this.normalizeCommunityName(communityName);
      let user: FirebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError: any) {
        // ISSUE 5 FIX: Handle existing Auth account for separate admin role
        if (authError.code === 'auth/email-already-in-use') {
          const signInResult = await signInWithEmailAndPassword(auth, email, password);
          user = signInResult.user;
        } else {
          throw authError;
        }
      }

      // ISSUE 5: Composite ID for admin role in specific community
      // Use the normalized community name for the profile ID
      const profileId = `${user.uid}_admin_${normalizedComm}`;
      const adminData: UserData = {
        id: user.uid,
        adminName,
        email,
        // Use the normalized community name for the admin data
        communityName: normalizedComm,
        role: 'admin'
      };
      await setDoc(doc(firestore, 'users', profileId), adminData);

      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', adminName);
      this.setCommunityName(communityName);

      // ISSUE 1: Trigger registration webhook
      this.webhookService.triggerUserRegistration(email, adminName, user.uid);

      return { success: true };
    } catch (error: any) {
      console.error('Admin registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginUser(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // ISSUE 6 & 8: Normalize community and perform login
      const normalizedComm = this.normalizeCommunityName(communityName);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ISSUE 8 FIX: Instead of looking for a profile BOUND to this community,
      // we check if the user HAS an account at all for this role, then let them in.
      const q = query(collection(firestore, 'users'), where('id', '==', user.uid), where('role', '==', 'user'));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as UserData;
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', userData.username || '');

        // ACCEPT the community name typed in the login form as the current context
        this.setCommunityName(normalizedComm);

        // ISSUE 1 FIX: Trigger login notification email
        this.webhookService.triggerUserLogin(email, userData.username || '');

        return { success: true };
      } else {
        // Sign out if no user profile exists at all for this UID
        await signOut(auth);
        return { success: false, error: 'User account exists but profile data is missing. Please contact support.' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginAdmin(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // ISSUE 6 & 8: Normalize community name
      const normalizedComm = this.normalizeCommunityName(communityName);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ISSUE 8 FIX: Check if they are an admin in ANY community first
      const q = query(collection(firestore, 'users'), where('id', '==', user.uid), where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as UserData;
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', userData.adminName || '');

        // ACCEPT the typed community name as the new admin dashboard context
        this.setCommunityName(normalizedComm);

        // ISSUE 1 FIX: Trigger login notification email
        this.webhookService.triggerUserLogin(email, userData.adminName || '');

        return { success: true };
      } else {
        await signOut(auth);
        return { success: false, error: 'Access denied. Account does not have admin permissions.' };
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message };
    }
  }
  setCommunityName(name: string): void { // This line defines the setCommunityName method, which takes a name parameter of type string and returns void, used to set the community name in the service and local storage.
    const normalized = this.normalizeCommunityName(name);
    this.communityName = normalized;
    localStorage.setItem('communityName', normalized);
    this.communityNameSubject.next(normalized); // ISSUE 5: Emit change to subscribers
  } // This closes the setCommunityName method.

  getCommunityName(): string { // This line defines the getCommunityName method, which returns a string, used to get the current community name from the service or local storage.
    if (!this.communityName) { // This line checks if the communityName property is not set.
      const raw = localStorage.getItem('communityName') || '';
      this.communityName = this.normalizeCommunityName(raw);
    } // This closes the if block.
    return this.communityName; // This line returns the community name.
  } // This closes the getCommunityName method.

  getCurrentUser(): FirebaseUser | null { // This line defines the getCurrentUser method, which returns the current Firebase user or null, used to get the currently authenticated user.
    return this.currentUser; // This line returns the currentUser property.
  } // This closes the getCurrentUser method.

  async updateUserProfile(field: string, value: string): Promise<void> { // This line defines the async updateUserProfile method, which takes field and value parameters of type string and returns Promise<void>, used to update a specific field in the user's profile.
    if (!this.currentUser) { // This line checks if there is no current user.
      throw new Error('No user logged in'); // This line throws an error if no user is logged in.
    } // This closes the if block.
    try { // This line starts a try block to handle potential errors during profile update.
      const userDocRef = doc(firestore, 'users', this.currentUser.uid); // This line gets the reference to the user's document in Firestore.
      const updateData: Partial<UserData> = {}; // This line creates an empty object for update data.
      if (field === 'username') { // This line checks if the field is 'username'.
        updateData.username = value; // This line sets the username in updateData.
        localStorage.setItem('userName', value); // This line updates local storage.
      } else if (field === 'email') { // This line checks if the field is 'email'.
        updateData.email = value; // This line sets the email in updateData.
        localStorage.setItem('userEmail', value); // This line updates local storage.
      } else if (field === 'communityName') { // This line checks if the field is 'communityName'.
        const normalized = this.normalizeCommunityName(value);
        updateData.communityName = normalized; // This line sets the normalized communityName in updateData.
        this.setCommunityName(normalized); // This line updates the community name in the service.
      } // This closes the if-else block.
      await updateDoc(userDocRef, updateData); // This line updates the user document in Firestore.

      // STEP 3 FIX: Trigger webhook only AFTER successful profile update in Firestore
      // Pass required fields: email, username (or fallback), userId, and the specific changes
      const userName = localStorage.getItem('userName') || 'User';
      this.webhookService.triggerProfileUpdate(this.currentUser.email || '', userName, this.currentUser.uid, updateData);

      // Trigger local automation logic (legacy log)
      this.triggerAutomation('profileUpdate', { field, value });
    } catch (error) { // This line starts a catch block to handle any errors during profile update.
      console.error('Error updating user profile:', error); // This line logs the error to the console.
      throw error; // This line re-throws the error.
    } // This closes the catch block.
  } // This closes the updateUserProfile method.

  logout(): void { // This line defines the logout method, which returns void, used to log out the current user.
    signOut(auth).then(() => { // This line signs out the user using Firebase Auth.
      this.clearUserData(); // This line clears user data from local storage and resets properties.
    }).catch((error) => { // This line catches any errors during sign out.
      console.error('Error signing out:', error); // This line logs the error to the console.
    }); // This closes the promise chain.
  } // This closes the logout method.

  isAuthenticated(): boolean { // This line defines the isAuthenticated method, which returns a boolean indicating if a user is currently authenticated.
    return this.currentUser !== null; // This line returns true if currentUser is not null, false otherwise.
  } // This closes the isAuthenticated method.

  listenToMembersCount(callback: (count: number) => void): (() => void) | null { // This line defines the listenToMembersCount method, which takes a callback function and returns an unsubscribe function or null, used to listen to changes in the number of members in the community.
    const rawComm = this.getCommunityName(); // This line gets the current community name.
    if (!rawComm) return null; // This line returns null if no community name is set.

    // ISSUE 6: Normalize for consistent listener performance
    const normalized = this.normalizeCommunityName(rawComm);
    const q = query(collection(firestore, 'users'), where('communityName', '==', normalized)); // This line creates a query to get users in the community.
    const unsubscribe = onSnapshot(q, (querySnapshot) => { // This line sets up a real-time listener on the query.
      const count = querySnapshot.size; // This line gets the number of documents in the snapshot.
      callback(count); // This line calls the callback with the count.
    }); // This closes the onSnapshot callback.
    return unsubscribe; // This line returns the unsubscribe function.
  } // This closes the listenToMembersCount method.

  async getAdminNameForCommunity(communityName: string): Promise<string> { // This line defines the async getAdminNameForCommunity method, which takes a communityName parameter and returns a Promise<string>, used to get the admin name for a given community.
    try { // This line starts a try block to handle potential errors.
      const normalized = this.normalizeCommunityName(communityName);
      const q = query(collection(firestore, 'users'), where('communityName', '==', normalized), where('role', '==', 'admin')); // This line creates a query to get admin users in the community.
      const querySnapshot = await getDocs(q); // This line executes the query.
      if (!querySnapshot.empty) { // This line checks if there are any admin users.
        const adminDoc = querySnapshot.docs[0]; // This line gets the first admin document.
        const adminData = adminDoc.data() as UserData; // This line casts the data to UserData.
        return adminData.adminName || 'Admin'; // This line returns the admin name or 'Admin' as default.
      } // This closes the if block.
      return 'Admin'; // This line returns 'Admin' if no admin found.
    } catch (error) { // This line starts a catch block to handle errors.
      console.error('Error getting admin name:', error); // This line logs the error.
      return 'Admin'; // This line returns 'Admin' as fallback.
    } // This closes the catch block.
  } // This closes the getAdminNameForCommunity method.

  async getMembers(): Promise<UserData[]> { // This line defines the async getMembers method, which returns a Promise of an array of UserData, used to get all members in the current community.
    const communityName = this.getCommunityName(); // This line gets the current community name.
    if (!communityName) return []; // This line returns an empty array if no community name.
    try { // This line starts a try block.
      const q = query(collection(firestore, 'users'), where('communityName', '==', communityName)); // This line creates a query for users in the community.
      const querySnapshot = await getDocs(q); // This line executes the query.
      const members: UserData[] = []; // This line initializes an empty array for members.
      querySnapshot.forEach((doc) => { // This line iterates over the documents.
        const data = doc.data() as UserData; // This line gets the data.
        data.id = doc.id; // This line sets the id from the document.
        members.push(data); // This line adds the data to the array.
      }); // This closes the forEach loop.
      return members; // This line returns the members array.
    } catch (error) { // This line starts a catch block.
      console.error('Error getting members:', error); // This line logs the error.
      return []; // This line returns an empty array on error.
    } // This closes the catch block.
  } // This closes the getMembers method.

  async deleteUser(uid: string): Promise<void> { // This line defines the async deleteUser method, which takes a uid parameter and returns Promise<void>, used to delete a user from Firestore.
    try { // This line starts a try block.
      await deleteDoc(doc(firestore, 'users', uid)); // This line deletes the user document from Firestore.
    } catch (error) { // This line starts a catch block.
      console.error('Error deleting user:', error); // This line logs the error.
      throw error; // This line re-throws the error.
    } // This closes the catch block.
  } // This closes the deleteUser method.

  async toggleBlockUser(uid: string, isBlocked: boolean): Promise<void> { // This line defines the async toggleBlockUser method, which takes uid and isBlocked parameters and returns Promise<void>, used to toggle the block status of a user.
    try { // This line starts a try block.
      const userRef = doc(firestore, 'users', uid); // This line gets the reference to the user document.
      await updateDoc(userRef, { isBlocked }); // This line updates the isBlocked field.
    } catch (error) { // This line starts a catch block.
      console.error('Error toggling block user:', error); // This line logs the error.
      throw error; // This line re-throws the error.
    } // This closes the catch block.
  } // This closes the toggleBlockUser method.

  getRegisteredUsers(): any[] { // This line defines the getRegisteredUsers method, which returns an array of any, used to get registered users from local storage.
    const users = localStorage.getItem('registeredUsers'); // This line gets the registered users from local storage.
    return users ? JSON.parse(users) : []; // This line parses the JSON or returns an empty array.
  } // This closes the getRegisteredUsers method.

  setRegisteredUsers(users: any[]): void { // This line defines the setRegisteredUsers method, which takes an array of any and returns void, used to set registered users in local storage.
    localStorage.setItem('registeredUsers', JSON.stringify(users)); // This line stringifies and stores the users in local storage.
  } // This closes the setRegisteredUsers method.

  getRegisteredAdmins(): any[] { // This line defines the getRegisteredAdmins method, which returns an array of any, used to get registered admins from local storage.
    const admins = localStorage.getItem('registeredAdmins'); // This line gets the registered admins from local storage.
    return admins ? JSON.parse(admins) : []; // This line parses the JSON or returns an empty array.
  } // This closes the getRegisteredAdmins method.

  setRegisteredAdmins(admins: any[]): void { // This line defines the setRegisteredAdmins method, which takes an array of any and returns void, used to set registered admins in local storage.
    localStorage.setItem('registeredAdmins', JSON.stringify(admins)); // This line stringifies and stores the admins in local storage.
  } // This closes the setRegisteredAdmins method.
} // This closes the AuthService class.
