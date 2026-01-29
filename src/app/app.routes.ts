// Import the Routes type from Angular Router to define navigation paths
import { Routes } from '@angular/router';
// Import components for admin login page
import { LoginAdminComponent } from './pages/login-admin/login-admin';
// Import components for user login page
import { LoginUserComponent } from './pages/login-user/login-user';
// Import components for admin registration page
import { RegisterAdminComponent } from './pages/register-admin/register-admin';
// Import components for user registration page
import { RegisterUserComponent } from './pages/register-user/register-user';
// Import components for the home page
import { HomeComponent } from './pages/home/home';
// Import components for the feed page
import { FeedComponent } from './pages/feed/feed';
// Import components for forgot password page
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
// Import components for reset password page
import { ResetPasswordComponent } from './pages/reset-password/reset-password';
// Import components for writing posts page
import { WritePostComponent } from './pages/write-post/write-post';
// Import components for image post page
import { ImagePostComponent } from './pages/image-post/image-post';
// Import components for messaging page
import { MessageComponent } from './pages/message/message';
// Import components for AI configuration page
import { ConfigAiComponent } from './pages/config-ai/config-ai';
// Import components for user management page
import { UserManagementComponent } from './pages/user-management/usermanagement';
// Import components for stats page
import { StatsComponent } from './pages/stats/stats';
// Import components for admin messaging page
import { AdminMessageComponent } from './pages/admin-message/admin-message';
// Import components for user profile page
import { ProfileComponent } from './pages/profile/profile';
// Import components for viewing other user profiles
import { UserProfileComponent } from './pages/user-profile/user-profile';
// Import components for history page
import { HistoryComponent } from './pages/history/history';
// Import guard to check if user is logged in before accessing certain pages
import { AuthGuard } from './guards/auth.guard';
// Import guard to check if user is an admin before accessing admin pages
import { AdminGuard } from './guards/admin.guard';


// Export the routes configuration as a constant array of route objects
export const routes: Routes = [
  // If no path is specified, redirect to the home page completely
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  // Route for the home page, shows HomeComponent
  { path: 'home', component: HomeComponent },
  // Route for admin login, shows LoginAdminComponent
  { path: 'login-admin', component: LoginAdminComponent },
  // Route for user login, shows LoginUserComponent
  { path: 'login-user', component: LoginUserComponent },
  // Route for admin registration, shows RegisterAdminComponent
  { path: 'register-admin', component: RegisterAdminComponent },
  // Route for user registration, shows RegisterUserComponent
  { path: 'register-user', component: RegisterUserComponent },
  // Route for feed, requires user to be logged in (AuthGuard), shows FeedComponent
  { path: 'feed', component: FeedComponent, canActivate: [AuthGuard] },
  // Route for forgot password, shows ForgotPasswordComponent
  { path: 'forgot-password', component: ForgotPasswordComponent },
  // Route for reset password, shows ResetPasswordComponent
  { path: 'reset-password', component: ResetPasswordComponent },
  // Route for writing posts, requires login, shows WritePostComponent
  { path: 'write-post', component: WritePostComponent, canActivate: [AuthGuard] },
  // Route for image posts, requires login, shows ImagePostComponent
  { path: 'image-post', component: ImagePostComponent, canActivate: [AuthGuard] },
  // Route for messaging, requires login, shows MessageComponent
  { path: 'message', component: MessageComponent, canActivate: [AuthGuard] },
  // Route for AI config, requires login, shows ConfigAiComponent
  { path: 'config-ai', component: ConfigAiComponent, canActivate: [AuthGuard] },
  // Route for user management, requires admin access, shows UserManagementComponent
  { path: 'user-management', component: UserManagementComponent, canActivate: [AdminGuard] },
  // Route for stats, requires admin access, shows StatsComponent
  { path: 'stats', component: StatsComponent, canActivate: [AdminGuard] },
  // Route for admin messages, requires admin access, shows AdminMessageComponent
  { path: 'admin-message', component: AdminMessageComponent, canActivate: [AdminGuard] },
  // Route for user profile, requires login, shows ProfileComponent
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  // Route for viewing other users' profiles, requires login, shows UserProfileComponent
  { path: 'user-profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  // Route for history, requires login, shows HistoryComponent
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard] },

  // Catch-all route: if no other route matches, redirect to home
  { path: '**', redirectTo: '/home' }
]; // This closes the routes array, completing the definition of all navigation routes for the application.
