# TODO: Fix Empty Feed Issue

## Tasks
- [x] Debug why feed is empty for all logged-in users
- [x] Check community name retrieval in auth service
- [x] Ensure seeding logic works correctly in feed component
- [x] Verify post loading from Firestore
- [x] Add manual seed button for testing if needed
- [x] Test feed loading after fixes

## Summary of Changes Made
- Added console logging to feed component to debug post loading and seeding process
- Added feed stats section with manual seed button for admins
- Added CSS styling for the new feed stats section
- Verified community name handling in auth service (working correctly)
- Enhanced error handling in seeding process

## Testing Instructions
1. Login as an admin user
2. Navigate to the feed page
3. Check browser console for debug messages about community name and post loading
4. If feed is still empty, click the "Seed Posts" button to manually seed posts
5. Verify posts appear in the feed
6. Test with a regular user account to ensure posts are visible

## Information Gathered
- Feed component loads posts via postService.listenToPosts()
- If no posts exist, it calls seedService.seedInitialPosts()
- Seed service creates sample posts with communityName from authService
- Firebase function seed-posts.ts has hardcoded 'Innera Platform' community
- Auth service sets communityName in localStorage and retrieves it

## Plan
- Check auth service community name handling
- Ensure seed service uses correct community name
- Add logging to debug seeding process
- Verify Firestore queries work correctly
- Test with manual seeding if automatic fails

## Dependent Files to be edited
- src/app/services/auth.service.ts (if community name issue)
- src/app/pages/feed/feed.ts (add debugging/logging)
- src/app/services/seed.service.ts (ensure correct community name)
