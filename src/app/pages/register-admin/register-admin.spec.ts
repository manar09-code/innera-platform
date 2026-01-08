import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterAdmin } from './register-admin';

describe('RegisterAdmin', () => {
  let component: RegisterAdmin;
  let fixture: ComponentFixture<RegisterAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
