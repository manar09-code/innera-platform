// This file is located in the src/app/services folder, which contains service files that provide reusable functionality across the application, such as authentication, data management, and external integrations. This file serves as the authentication service. Its role is to handle user authentication, registration, login, logout, and user data management using Firebase Auth and Firestore. It interacts with Firebase for authentication and database operations, WebhookService for triggering external automations, and other parts of the app like components and guards for user management.
// Import Angular's Injectable decorator to make this a service that can be injected into components
import { Injectable } from '@angular/core'; // This line imports the Injectable decorator from '@angular/core', which is needed to mark this class as a service that can be injected into other components and services.
// Import Firebase Auth functions for user authentication (register, login, logout, etc.)
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // This line imports various Firebase Auth functions and types from the 'firebase/auth' module, which are needed for user authentication operations like registration, login, logout, and listening to auth state changes.
// Import Firestore functions for database operations (read, write, update, delete documents)
import { Firestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'; // This line imports Firestore functions and types from the 'firebase/firestore' module, which are needed for database operations like reading, writing, updating, and deleting documents in the Firestore database.
// Import Firebase instances (auth and firestore) configured in the app
import { auth, firestore } from '../firebase.config'; // This line imports the configured Firebase auth and firestore instances from '../firebase.config', which are needed to perform authentication and database operations using the app's Firebase setup.
// Import WebhookService to trigger external automations (e.g., via Make.com)
import { WebhookService } from './webhook.service'; // This line imports the WebhookService from './webhook.service', which is needed to trigger external automations and webhooks for events like user registration and login.

// Interface defining the structure of user data stored in Firestore
interface UserData { // This line defines the UserData interface, which specifies the structure of user data objects stored in Firestore, ensuring type safety and consistency.
  username?: string; // This line defines the optional username property for regular users, which is a string representing the user's display name.
  adminName?: string; // This line defines the optional adminName property for admin users, which is a string representing the admin's display name.
  email: string; // This line defines the required email property, which is a string representing the user's email address.
  communityName: string; // This line defines the required communityName property, which is a string representing the name of the community the user belongs to.
  role: 'user' | 'admin'; // This line defines the required role property, which is a union type of 'user' or 'admin', indicating the user's role in the system.
} // This closes the UserData interface, completing the definition of the user data structure.

@Injectable({ // This line applies the Injectable decorator to the class, making it a service that can be injected into other components and services, with the providedIn option set to 'root' to make it a singleton service available throughout the app.
  providedIn: 'root', // This line specifies that the service is provided in the root injector, making it a singleton instance available app-wide.
}) // This closes the Injectable decorator configuration.
export class AuthService { // This line exports the AuthService class, which is the main authentication service class that handles user authentication and data management.
  private communityName: string = ''; // This line declares a private property communityName of type string, initialized to an empty string, used to store the current community name.
  private currentUser: FirebaseUser | null = null; // This line declares a private property currentUser of type FirebaseUser or null, initialized to null, used to store the currently authenticated user.

  constructor(private webhookService: WebhookService) { // This line defines the constructor for the AuthService class, which takes a WebhookService instance as a parameter for dependency injection, used to trigger webhooks.
    // Listen to authentication state changes
    onAuthStateChanged(auth, (user) => { // This line calls the onAuthStateChanged function to listen for changes in the authentication state, executing the callback function whenever the user logs in or out.
      this.currentUser = user; // This line sets the currentUser property to the user object if authenticated, or null if not.
      if (user) { // This line checks if a user is authenticated, and if so, loads the user's data.
        this.loadUserData(user.uid); // This line calls the loadUserData method with the user's UID to load additional user data from Firestore.
      } else { // This line executes if no user is authenticated, clearing the user data.
        this.clearUserData(); // This line calls the clearUserData method to clear stored user data from local storage and reset properties.
      } // This closes the if-else block.
    }); // This closes the onAuthStateChanged callback function.
  } // This closes the constructor.

  private async loadUserData(uid: string): Promise<void> { // This line defines the private async loadUserData method, which takes a uid parameter of type string and returns a Promise<void>, used to load user data from Firestore based on the user's UID.
    try { // This line starts a try block to handle potential errors during data loading.
      const userDoc = await getDoc(doc(firestore, 'users', uid)); // This line retrieves the user document from Firestore using the getDoc function and the doc reference for the 'users' collection and the given uid.
      if (userDoc.exists()) { // This line checks if the user document exists in Firestore.
        const userData = userDoc.data() as UserData; // This line gets the data from the user document and casts it to the UserData type.
        localStorage.setItem('userRole', userData.role); // This line stores the user's role in local storage.
        localStorage.setItem('userEmail', userData.email); // This line stores the user's email in local storage.
        localStorage.setItem('userName', userData.username || userData.adminName || ''); // This line stores the user's name (username or adminName) in local storage, defaulting to an empty string if not available.
        this.setCommunityName(userData.communityName); // This line calls the setCommunityName method to set the community name property and local storage.
      } // This closes the if block for checking if the user document exists.
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
  } // This closes the clearUserData method.

  async registerUser(username: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> { // This line defines the async registerUser method, which takes username, email, password, and communityName parameters of type string, and returns a Promise of an object with success boolean and optional error string, used to register a new user with Firebase Auth and store data in Firestore.
    try { // This line starts a try block to handle potential errors during registration.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password); // This line creates a new user account with the provided email and password using Firebase Auth.
      const user = userCredential.user; // This line gets the user object from the user credential.
      // Store additional user data in Firestore
      const userData: UserData = { // This line creates a userData object with the provided user information.
        username, // This line sets the username property.
        email, // This line sets the email property.
        communityName, // This line sets the communityName property.
        role: 'user' // This line sets the role property to 'user'.
      }; // This closes the userData object.
      await setDoc(doc(firestore, 'users', user.uid), userData); // This line stores the userData in Firestore under the 'users' collection with the user's UID as the document ID.
      // Set local storage
      localStorage.setItem('userRole', 'user'); // This line stores the role 'user' in local storage.
      localStorage.setItem('userEmail', email); // This line stores the email in local storage.
      localStorage.setItem('userName', username); // This line stores the username in local storage.
      this.setCommunityName(communityName); // This line calls the setCommunityName method to set the community name.
      // Trigger automation webhook
      this.triggerAutomation('userRegistration', { email, name: username, userId: user.uid }); // This line calls the triggerAutomation method to trigger a webhook for user registration.
      return { success: true }; // This line returns an object indicating successful registration.
    } catch (error: any) { // This line starts a catch block to handle any errors during registration.
      console.error('Registration error:', error); // This line logs the error to the console.
      return { success: false, error: error.message }; // This line returns an object indicating failed registration with the error message.
    } // This closes the catch block.
  } // This closes the registerUser method.

  async registerAdmin(adminName: string, email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> { // This line defines the async registerAdmin method, which takes adminName, email, password, and communityName parameters of type string, and returns a Promise of an object with success boolean and optional error string, used to register a new admin with Firebase Auth and store data in Firestore.
    try { // This line starts a try block to handle potential errors during admin registration.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password); // This line creates a new admin account with the provided email and password using Firebase Auth.
      const user = userCredential.user; // This line gets the user object from the user credential.
      // Store additional admin data in Firestore
      const adminData: UserData = { // This line creates a adminData object with the provided admin information.
        adminName, // This line sets the adminName property.
        email, // This line sets the email property.
        communityName, // This line sets the communityName property.
        role: 'admin' // This line sets the role property to 'admin'.
      }; // This closes the adminData object.
      await setDoc(doc(firestore, 'users', user.uid), adminData); // This line stores the adminData in Firestore under the 'users' collection with the user's UID as the document ID.
      // Set local storage
      localStorage.setItem('userRole', 'admin'); // This line stores the role 'admin' in local storage.
      localStorage.setItem('userEmail', email); // This line stores the email in local storage.
      localStorage.setItem('userName', adminName); // This line stores the adminName in local storage.
      this.setCommunityName(communityName); // This line calls the setCommunityName method to set the community name.
      // Trigger automation webhook
      this.triggerAutomation('userRegistration', { email, name: adminName, userId: user.uid }); // This line calls the triggerAutomation method to trigger a webhook for admin registration.
      return { success: true }; // This line returns an object indicating successful admin registration.
    } catch (error: any) { // This line starts a catch block to handle any errors during admin registration.
      console.error('Admin registration error:', error); // This line logs the error to the console.
      return { success: false, error: error.message }; // This line returns an object indicating failed admin registration with the error message.
    } // This closes the catch block.
  } // This closes the registerAdmin method.

  async loginUser(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> { // This line defines the async loginUser method, which takes email, password, and communityName parameters of type string, and returns a Promise of an object with success boolean and optional error string, used to log in a user with Firebase Auth and verify community and role.
    try { // This line starts a try block to handle potential errors during user login.
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // This line signs in the user with the provided email and password using Firebase Auth.
      const user = userCredential.user; // This line gets the user object from the user credential.
      // Verify community name matches
      const userDoc = await getDoc(doc(firestore, 'users', user.uid)); // This line retrieves the user document from Firestore to verify community and role.
      if (userDoc.exists()) { // This line checks if the user document exists in Firestore.
        const userData = userDoc.data() as UserData; // This line gets the data from the user document and casts it to the UserData type.
        if (userData.communityName !== communityName || userData.role !== 'user') { // This line checks if the community name matches and the role is 'user'.
          await signOut(auth); // This line signs out the user if the verification fails.
          return { success: false, error: 'Invalid credentials or community name' }; // This line returns an object indicating failed login with an error message.
        } // This closes the if block for verification.
        // Set local storage
        localStorage.setItem('userRole', 'user'); // This line stores the role 'user' in local storage.
        localStorage.setItem('userEmail', email); // This line stores the email in local storage.
        localStorage.setItem('userName', userData.username || ''); // This line stores the username in local storage, defaulting to an empty string if not available.
        this.setCommunityName(communityName); // This line calls the setCommunityName method to set the community name.
        // Trigger automation webhook
        this.triggerAutomation('userLogin', { email, name: userData.username || '' }); // This line calls the triggerAutomation method to trigger a webhook for user login.
        return { success: true }; // This line returns an object indicating successful login.
      } else { // This line executes if the user document does not exist.
        await signOut(auth); // This line signs out the user.
        return { success: false, error: 'User data not found' }; // This line returns an object indicating failed login with an error message.
      } // This closes the else block.
    } catch (error: any) { // This line starts a catch block to handle any errors during user login.
      console.error('Login error:', error); // This line logs the error to the console.
      return { success: false, error: error.message }; // This line returns an object indicating failed login with the error message.
    } // This closes the catch block.
  } // This closes the loginUser method.

  async loginAdmin(email: string, password: string, communityName: string): Promise<{ success: boolean; error?: string }> { // This line defines the async loginAdmin method, which takes email, password, and communityName parameters of type string, and returns a Promise of an object with success boolean and optional error string, used to log in an admin with Firebase Auth and verify community and role.
    try { // This line starts a try block to handle potential errors during admin login.
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // This line signs in the admin with the provided email and password using Firebase Auth.
      const user = userCredential.user; // This line gets the user object from the user credential.
      // Verify community name matches and role is admin
      const userDoc = await getDoc(doc(firestore, 'users', user.uid)); // This line retrieves the user document from Firestore to verify community and role.
      if (userDoc.exists()) { // This line checks if the user document exists in Firestore.
        const userData = userDoc.data() as UserData; // This line gets the data from the user document and casts it to the UserData type.
        if (userData.communityName !== communityName || userData.role !== 'admin') { // This line checks if the community name matches and the role is 'admin'.
          await signOut(auth); // This line signs out the admin if the verification fails.
          return { success: false, error: 'Invalid credentials or community name' }; // This line returns an object indicating failed login with an error message.
        } // This closes the if block for verification.
        // Set local storage
        localStorage.setItem('userRole', 'admin'); // This line stores the role 'admin' in local storage.
        localStorage.setItem('userEmail', email); // This line stores the email in local storage.
        localStorage.setItem('userName', userData.adminName || ''); // This line stores the adminName in local storage, defaulting to an empty string if not available.
        this.setCommunityName(communityName); // This line calls the setCommunityName method to set the community name.
        // Trigger automation webhook
        this.triggerAutomation('userLogin', { email, name: userData.adminName || '' }); // This line calls the triggerAutomation method to trigger a webhook for admin login.
        return { success: true }; // This line returns an object indicating successful login.
      } else { // This line executes if the user document does not exist.
        await signOut(auth); // This line signs out the admin.
        return { success: false, error: 'Admin data not found' }; // This line returns an object indicating failed login with an error message.
      } // This closes the else block.
    } catch (error: any) { // This line starts a catch block to handle any errors during admin login.
      console.error('Admin login error:', error); // This line logs the error to the console.
      return { success: false, error: error.message }; // This line returns an object indicating failed login with the error message.
    } // This closes the catch block.
  } // This closes the loginAdmin method.

  setCommunityName(name: string): void { // This line defines the setCommunityName method, which takes a name parameter of type string and returns void, used to set the community name in the service and local storage.
    this.communityName = name; // This line sets the communityName property to the provided name.
    localStorage.setItem('communityName', name); // This line stores the community name in local storage.
  } // This closes the setCommunityName method.

  getCommunityName(): string { // This line defines the getCommunityName method, which returns a string, used to get the current community name from the service or local storage.
    if (!this.communityName) { // This line checks if the communityName property is not set.
      this.communityName = localStorage.getItem('communityName') || ''; // This line retrieves the community name from local storage and sets it to the property, defaulting to an empty string if not found.
    } // This closes the if block.
