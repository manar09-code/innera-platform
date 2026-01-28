# Angular 21 Upgrade Tasks

- [x] Install @angular/fire@21.0.0 and firebase@10.15.0
- [x] Update src/app/app.config.ts to use new AngularFire 21 modular imports
- [x] Fix src/app/components/navbar/navbar.ts: remove merge markers, keep single constructor with Router, TranslationService, AuthService, add AuthService import, implement single ngOnInit using authService
- [x] Update src/app/components/webhook-test/webhook-test.component.ts to use inject(Auth) instead of constructor injection
- [x] Add typeCheckHostBindings: true to tsconfig.json angularCompilerOptions
- [x] Run ng serve to test the project
