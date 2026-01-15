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
import { DashboardComponent } from './pages/dashboard/dashboard';
import { StatsComponent } from './pages/stats/stats';
import { AdminMessageComponent } from './pages/admin-message/admin-message';
import { ProfileComponent } from './pages/profile/profile';
import { UserProfileComponent } from './pages/user-profile/user-profile';
import { HistoryComponent } from './pages/history/history';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'login-user', component: LoginUserComponent },
  { path: 'register-admin', component: RegisterAdminComponent },
  { path: 'register-user', component: RegisterUserComponent },
  { path: 'stats', component: StatsComponent, canActivate: [AdminGuard] },
  { path: 'admin-message', component: AdminMessageComponent, canActivate: [AdminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AdminGuard] },
  { path: 'user-profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
  { path: 'home', component: HomeComponent },
  { path: 'feed', component: FeedComponent, canActivate: [AuthGuard] },
  { path: 'write-post', component: WritePostComponent, canActivate: [AuthGuard] },
  { path: 'image-post', component: ImagePostComponent, canActivate: [AuthGuard] },
  { path: 'message', component: MessageComponent, canActivate: [AuthGuard] },

  { path: 'config-ai', component: ConfigAiComponent, canActivate: [AdminGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
];
