# TODO: Fix Angular Project Issues

## AuthService Fixes
- [x] Update handleDeviceLogin() to handle IP fetch with fallback to '0.0.0.0'
- [x] Ensure webhook sends regardless of IP fetch failure
- [x] Add console.log before webhook send for debugging
- [x] Use proper try/catch and async/await

## FeedComponent Fixes
- [x] Consolidate community name subscription to avoid multiple loadPostsFromFirestore calls
- [x] Remove duplicate direct calls to loadPostsFromFirestore
- [x] Ensure proper subscription cleanup on destroy

## Testing
- [ ] Verify login flow continues on IP fetch failure
- [ ] Verify feed loads only once per query
- [ ] Verify webhook appears in Network tab
- [ ] Test in development and production environments
