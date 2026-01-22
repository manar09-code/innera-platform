import { Routes } from '@angular/router';
import { LoginAdminComponent } from './pages/login-admin/login-admin';
import { LoginUserComponent } from './pages/login-user/login-user';
import { RegisterAdminComponent } from './pages/register-admin/register-admin';
import { RegisterUserComponent } from './pages/register-user/register-user';
import { HomeComponent } from './pages/home/home';
import { FeedComponent } from './pages/feed/feed';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { ResetPasswordComponent } from './pages/reset-password/reset-password';
import { WritePostComponent } from './pages/write-post/write-post';
import { ImagePostComponent } from './pages/image-post/image-post';
import { MessageComponent } from './pages/message/message';

import { ConfigAiComponent } from './pages/config-ai/config-ai';
import { UserManagementComponent } from './pages/user-management/usermanagement';
import { StatsComponent } from './pages/stats/stats';
import { AdminMessageComponent } from './pages/admin-message/admin-message';
import { ProfileComponent } from './pages/profile/profile';
import { UserProfileComponent } from './pages/user-profile/user-profile';
import { HistoryComponent } from './pages/history/history';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { WebhookTestComponent } from './components/webhook-test/webhook-test.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'login-user', component: LoginUserComponent },
  { path: 'register-admin', component: RegisterAdminComponent },
  { path: 'register-user', component: RegisterUserComponent },
  { path: 'feed', component: FeedComponent, canActivate: [AuthGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'write-post', component: WritePostComponent, canActivate: [AuthGuard] },
  { path: 'image-post', component: ImagePostComponent, canActivate: [AuthGuard] },
  { path: 'message', component: MessageComponent, canActivate: [AuthGuard] },
  { path: 'config-ai', component: ConfigAiComponent, canActivate: [AuthGuard] },
  { path: 'user-management', component: UserManagementComponent, canActivate: [AdminGuard] },
  { path: 'stats', component: StatsComponent, canActivate: [AdminGuard] },
  { path: 'admin-message', component: AdminMessageComponent, canActivate: [AdminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'user-profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard] },
  { path: 'webhook-test', component: WebhookTestComponent },
  { path: '**', redirectTo: '/home' }
];
