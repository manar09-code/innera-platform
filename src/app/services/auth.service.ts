import { Injectable } from '@angular/core';

interface User {
  username?: string;
  email: string;
  password: string;
  communityName: string;
}

interface Admin {
  adminName: string;
  email: string;
  password: string;
  communityName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private communityName: string = '';

  constructor() {
    // Add default test user if not exists
    const users = this.getRegisteredUsers();
    const testUser = users.find((u) => u.email === 'user@innera.com');
    if (!testUser) {
      users.push({
        username: 'Test User',
        email: 'user@innera.com',
        password: 'user123',
        communityName: 'Tunisia Hood',
      });
      this.setRegisteredUsers(users);
    }

    // Add default test admin if not exists
    const admins = this.getRegisteredAdmins();
    const testAdmin = admins.find((a) => a.email === 'admin@innera.com');
    if (!testAdmin) {
      admins.push({
        adminName: 'Test Admin',
        email: 'admin@innera.com',
        password: 'admin123',
        communityName: 'Tunisia Hood',
      });
      this.setRegisteredAdmins(admins);
    }
  }

  private getRegisteredUsers(): User[] {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  }

  private setRegisteredUsers(users: User[]): void {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  }

  private getRegisteredAdmins(): Admin[] {
    const admins = localStorage.getItem('registeredAdmins');
    return admins ? JSON.parse(admins) : [];
  }

  private setRegisteredAdmins(admins: Admin[]): void {
    localStorage.setItem('registeredAdmins', JSON.stringify(admins));
  }

  registerUser(username: string, email: string, password: string, communityName: string): boolean {
    const users = this.getRegisteredUsers();
    if (users.find((u) => u.email === email)) {
      return false; // Email already exists
    }
    users.push({ username, email, password, communityName });
    this.setRegisteredUsers(users);
    return true;
  }

  registerAdmin(
    adminName: string,
    email: string,
    password: string,
    communityName: string
  ): boolean {
    const admins = this.getRegisteredAdmins();
    if (admins.find((a) => a.email === email)) {
      return false; // Email already exists
    }
    admins.push({ adminName, email, password, communityName });
    this.setRegisteredAdmins(admins);
    return true;
  }

  loginUser(email: string, password: string, communityName: string): boolean {
    const users = this.getRegisteredUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password && u.communityName === communityName
    );
    if (user) {
      localStorage.setItem('userRole', 'user');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', user.username || '');
      this.setCommunityName(communityName);
      return true;
    }
    return false;
  }

  loginAdmin(email: string, password: string, communityName: string): boolean {
    const admins = this.getRegisteredAdmins();
    const admin = admins.find(
      (a) => a.email === email && a.password === password && a.communityName === communityName
    );
    if (admin) {
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', admin.adminName);
      this.setCommunityName(communityName);
      return true;
    }
    return false;
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
    return !!localStorage.getItem('userRole');
  }

  logout(): void {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('communityName');
    this.communityName = '';
  }

  getAdminNameForCommunity(communityName: string): string {
    const admins = this.getRegisteredAdmins();
    const admin = admins.find((a) => a.communityName === communityName);
    return admin ? admin.adminName : 'Unknown Admin';
  }
}
