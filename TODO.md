# TODO List for Profile, History, Stats Fixes

## Task 1 – Fix Navbar Profile Routing

- [x] Update navbar.ts navigateToProfile() to route to '/user-profile' for users and '/profile' for admins

## Task 2 – Add Stats Link to User Profile

- [x] Update user-profile.html to add Stats link in right-sidebar, matching admin profile design (only show if admin)

## Task 3 – Fix History GoBack

- [x] Update history.ts goBack() to navigate to '/user-profile' for users and '/profile' for admins

## Task 4 – Enhance Stats Page Content

- [x] Update stats.html to add more stat cards (e.g., Total Posts, Total Image Posts, etc.)

## Task 5 – Ensure History Dynamic Updates

- [x] Update history.ts loadUserHistory() to load latest data from localStorage

## Task 6 – Adjust Feed Welcome Overlay

- [x] Update feed.html to make welcome overlay longer to the left

## Task 7 – Test All Changes

- [x] Run the app and test profile, history, stats navigation and functionality

## Task 8 – Fix Build Errors

- [x] Fix TypeScript errors in stats.ts and user-profile.ts by adding missing properties
- [x] Run ng build to ensure no compilation errors
- [x] Run ng serve to test the application in development mode
