// This file is located in the src/app/pages folder, which contains page components that represent different views or routes in the application, such as home, feed, profile, etc. This file serves as the history component. Its role is to display the user's history of posts, likes, and comments in a paginated format. It interacts with AuthService for user authentication, PostService for fetching user data, and Router for navigation.
import { Component, OnInit } from '@angular/core'; // This line imports the Component decorator and OnInit interface from '@angular/core', which are needed to define the component and implement the lifecycle hook.
import { Router } from '@angular/router'; // This line imports the Router service from '@angular/router', which is needed for navigation between pages.
import { CommonModule } from '@angular/common'; // This line imports CommonModule from '@angular/common', which provides common directives like *ngIf and *ngFor.
import { AuthService } from '../../services/auth.service'; // This line imports AuthService from '../../services/auth.service', which is needed to handle user authentication and community data.
import { PostService, Post, Comment } from '../../services/post.service'; // This line imports PostService, Post, and Comment from '../../services/post.service', which are needed to fetch and manage post and comment data.
import { TranslatePipe } from '../../pipes/translate.pipe'; // This line imports TranslatePipe from '../../pipes/translate.pipe', which is needed to translate text in the template.
import { Timestamp } from 'firebase/firestore'; // This line imports Timestamp from 'firebase/firestore', which is needed to handle Firestore timestamp objects.

@Component({ // This line applies the Component decorator to the class, defining the component metadata.
  selector: 'app-history', // This line sets the selector to 'app-history', which is the HTML tag name for this component.
  standalone: true, // This line sets standalone to true, meaning the component manages its own dependencies.
  imports: [CommonModule, TranslatePipe], // This line lists the modules imported by this component.
  templateUrl: './history.html', // This line sets the templateUrl to './history.html', which is the path to the component's HTML template.
  styleUrls: ['./history.css'], // This line sets the styleUrls to ['./history.css'], which is the path to the component's CSS styles.
}) // This closes the Component decorator.
export class HistoryComponent implements OnInit { // This line exports the HistoryComponent class, which is the main component class for the history page, implementing the OnInit interface for lifecycle hooks.
  userPosts: Post[] = []; // This line declares a property userPosts, which is an array of Post objects representing the user's posts, initialized to an empty array.
  userLikes: Post[] = []; // This line declares a property userLikes, which is an array of Post objects representing the posts the user has liked, initialized to an empty array.
  userComments: Comment[] = []; // This line declares a property userComments, which is an array of Comment objects representing the user's comments, initialized to an empty array.
  profilePicture: string = '👤'; // This line declares a property profilePicture, which is a string representing the user's profile picture, initialized to a default emoji.
  backgroundImage: string = 'url(https://via.placeholder.com/800x200)'; // This line declares a property backgroundImage, which is a string representing the background image URL, initialized to a placeholder URL.
  userRole: string = ''; // This line declares a property userRole, which is a string representing the user's role, initialized to an empty string.

  // Pagination for posts // This line is a comment indicating the start of pagination properties for posts.
  postsCurrentPage: number = 1; // This line declares a property postsCurrentPage, which is a number representing the current page for posts pagination, initialized to 1.
  postsItemsPerPage: number = 5; // This line declares a property postsItemsPerPage, which is a number representing the number of posts per page, initialized to 5.
  postsTotalPages: number = 0; // This line declares a property postsTotalPages, which is a number representing the total number of pages for posts, initialized to 0.

  // Pagination for likes // This line is a comment indicating the start of pagination properties for likes.
  likesCurrentPage: number = 1; // This line declares a property likesCurrentPage, which is a number representing the current page for likes pagination, initialized to 1.
  likesItemsPerPage: number = 5; // This line declares a property likesItemsPerPage, which is a number representing the number of likes per page, initialized to 5.
  likesTotalPages: number = 0; // This line declares a property likesTotalPages, which is a number representing the total number of pages for likes, initialized to 0.

  // Pagination for comments // This line is a comment indicating the start of pagination properties for comments.
  commentsCurrentPage: number = 1; // This line declares a property commentsCurrentPage, which is a number representing the current page for comments pagination, initialized to 1.
  commentsItemsPerPage: number = 5; // This line declares a property commentsItemsPerPage, which is a number representing the number of comments per page, initialized to 5.
  commentsTotalPages: number = 0; // This line declares a property commentsTotalPages, which is a number representing the total number of pages for comments, initialized to 0.

  constructor( // This line defines the constructor for the HistoryComponent class.
    private router: Router, // This line injects the Router service for navigation.
    private authService: AuthService, // This line injects the AuthService for authentication.
    private postService: PostService // This line injects the PostService for post data.
  ) { } // This closes the constructor.

  ngOnInit() { // This line defines the ngOnInit lifecycle method, which is called after the component is initialized.
    this.userRole = localStorage.getItem('userRole') || ''; // This line retrieves the user role from local storage, defaulting to an empty string.
    this.loadHistory(); // This line calls the loadHistory method to load the user's history data.
  } // This closes the ngOnInit method.

  async loadHistory() { // This line defines the async loadHistory method, which loads the user's posts, likes, and comments.
    const userEmail = localStorage.getItem('userEmail') || ''; // This line retrieves the user email from local storage, defaulting to an empty string.
    const userName = localStorage.getItem('userName') || ''; // This line retrieves the user name from local storage, defaulting to an empty string.

    if (userEmail) { // This line checks if the user email exists.
      // Load User Posts // This line is a comment indicating the loading of user posts.
      this.userPosts = await this.postService.getUserPosts(userEmail); // This line fetches the user's posts using the post service.

      // Load User Likes // This line is a comment indicating the loading of user likes.
      this.userLikes = await this.postService.getUserLikedPosts(userName); // This line fetches the posts the user has liked using the post service.

      // Load User Comments // This line is a comment indicating the loading of user comments.
      this.userComments = await this.postService.getUserComments(userEmail); // This line fetches the user's comments using the post service.
    } // This closes the if block.

    // Calculate total pages // This line is a comment indicating the calculation of total pages.
    this.postsTotalPages = Math.ceil(this.userPosts.length / this.postsItemsPerPage); // This line calculates the total pages for posts.
    this.likesTotalPages = Math.ceil(this.userLikes.length / this.likesItemsPerPage); // This line calculates the total pages for likes.
    this.commentsTotalPages = Math.ceil(this.userComments.length / this.commentsItemsPerPage); // This line calculates the total pages for comments.
  } // This closes the loadHistory method.

  goBack() { // This line defines the goBack method, which navigates back to the appropriate profile page based on user role.
    if (this.userRole === 'admin') { // This line checks if the user role is admin.
      this.router.navigate(['/profile']); // This line navigates to the admin profile page.
    } else { // This line handles the else case.
      this.router.navigate(['/user-profile']); // This line navigates to the user profile page.
    } // This closes the if-else block.
  } // This closes the goBack method.

  toDate(time: any): Date | null { // This line defines the toDate method, which converts a timestamp to a Date object.
    if (!time) return null; // This line checks if time is falsy and returns null if so.
    if (time instanceof Timestamp) { // This line checks if time is a Timestamp instance.
      return time.toDate(); // This line converts the Timestamp to a Date and returns it.
    } // This closes the if block.
    // Handle string or number if legacy data exists // This line is a comment indicating handling of legacy data.
    return new Date(time); // This line creates a new Date from the time and returns it.
  } // This closes the toDate method.

  // Pagination methods for posts // This line is a comment indicating the start of pagination methods for posts.
  getPostsForCurrentPage(): Post[] { // This line defines the getPostsForCurrentPage method, which returns the posts for the current page.
    const startIndex = (this.postsCurrentPage - 1) * this.postsItemsPerPage; // This line calculates the start index for the current page.
    const endIndex = startIndex + this.postsItemsPerPage; // This line calculates the end index for the current page.
    return this.userPosts.slice(startIndex, endIndex); // This line slices the userPosts array and returns the subset for the current page.
  } // This closes the getPostsForCurrentPage method.

  nextPostsPage(): void { // This line defines the nextPostsPage method, which navigates to the next page of posts.
    if (this.postsCurrentPage < this.postsTotalPages) { // This line checks if the current page is less than the total pages.
      this.postsCurrentPage++; // This line increments the current page.
    } // This closes the if block.
  } // This closes the nextPostsPage method.

  prevPostsPage(): void { // This line defines the prevPostsPage method, which navigates to the previous page of posts.
    if (this.postsCurrentPage > 1) { // This line checks if the current page is greater than 1.
      this.postsCurrentPage--; // This line decrements the current page.
    } // This closes the if block.
  } // This closes the prevPostsPage method.

  // Pagination methods for likes // This line is a comment indicating the start of pagination methods for likes.
  getLikesForCurrentPage(): Post[] { // This line defines the getLikesForCurrentPage method, which returns the likes for the current page.
    const startIndex = (this.likesCurrentPage - 1) * this.likesItemsPerPage; // This line calculates the start index for the current page.
    const endIndex = startIndex + this.likesItemsPerPage; // This line calculates the end index for the current page.
    return this.userLikes.slice(startIndex, endIndex); // This line slices the userLikes array and returns the subset for the current page.
  } // This closes the getLikesForCurrentPage method.

  nextLikesPage(): void { // This line defines the nextLikesPage method, which navigates to the next page of likes.
    if (this.likesCurrentPage < this.likesTotalPages) { // This line checks if the current page is less than the total pages.
      this.likesCurrentPage++; // This line increments the current page.
    } // This closes the if block.
  } // This closes the nextLikesPage method.

  prevLikesPage(): void { // This line defines the prevLikesPage method, which navigates to the previous page of likes.
    if (this.likesCurrentPage > 1) { // This line checks if the current page is greater than 1.
      this.likesCurrentPage--; // This line decrements the current page.
    } // This closes the if block.
  } // This closes the prevLikesPage method.

  // Pagination methods for comments // This line is a comment indicating the start of pagination methods for comments.
  getCommentsForCurrentPage(): Comment[] { // This line defines the getCommentsForCurrentPage method, which returns the comments for the current page.
    const startIndex = (this.commentsCurrentPage - 1) * this.commentsItemsPerPage; // This line calculates the start index for the current page.
    const endIndex = startIndex + this.commentsItemsPerPage; // This line calculates the end index for the current page.
    return this.userComments.slice(startIndex, endIndex); // This line slices the userComments array and returns the subset for the current page.
  } // This closes the getCommentsForCurrentPage method.

  nextCommentsPage(): void { // This line defines the nextCommentsPage method, which navigates to the next page of comments.
    if (this.commentsCurrentPage < this.commentsTotalPages) { // This line checks if the current page is less than the total pages.
      this.commentsCurrentPage++; // This line increments the current page.
    } // This closes the if block.
  } // This closes the nextCommentsPage method.

  prevCommentsPage(): void { // This line defines the prevCommentsPage method, which navigates to the previous page of comments.
    if (this.commentsCurrentPage > 1) { // This line checks if the current page is greater than 1.
      this.commentsCurrentPage--; // This line decrements the current page.
    } // This closes the if block.
  } // This closes the prevCommentsPage method.
} // This closes the HistoryComponent class.
