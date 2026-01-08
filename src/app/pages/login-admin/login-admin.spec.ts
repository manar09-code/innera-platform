import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginAdmin } from './login-admin';

describe('LoginAdmin', () => {
  let component: LoginAdmin;
  let fixture: ComponentFixture<LoginAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
