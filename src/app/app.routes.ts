import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginAdminComponent } from './pages/login-admin/login-admin';
import { LoginUserComponent } from './pages/login-user/login-user';
import { RegisterAdminComponent } from './pages/register-admin/register-admin';
import { RegisterUserComponent } from './pages/register-user/register-user';
import { HomeComponent } from './pages/home/home';
import { FeedComponent } from './pages/feed/feed';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { ResetPasswordComponent } from './pages/reset-password/reset-password';

export const routes: Routes = [
  { path: '', redirectTo: 'login-admin', pathMatch: 'full' },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'login-user', component: LoginUserComponent },
  { path: 'register-admin', component: RegisterAdminComponent },
  { path: 'register-user', component: RegisterUserComponent },
  { path: 'home', component: HomeComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
];
