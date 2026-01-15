# TODO List for Fixes and Enhancements

## 1. Admin Interface

### 1.1 Remove AI Assistant from Feed Headers

- [ ] Remove AI Assistant circle from welcome card in `src/app/pages/feed/feed.html`

### 1.2 Add Floating AI Assistant Circle

- [ ] Add floating button at bottom-left of feed page in `src/app/pages/feed/feed.html`
- [ ] Ensure it navigates to `/ai-assistant` and uses admin instructions

### 1.3 Fix Admin Posts in Feed

- [ ] Modify `src/app/pages/feed/feed.ts` to load posts from shared community storage
- [ ] Ensure admin posts appear alongside user posts chronologically

### 1.4 Enhance Right-Side Feed Design

- [ ] Update `src/app/pages/feed/feed.css` with card/box styles for trending, popular posts, active members

### 1.5 Fix AI Assistant Knowledge

- [ ] Fix `functions/src/index.ts` to fetch admin instructions from Firestore
- [ ] Update `src/app/pages/config-ai/config-ai.ts` to save instructions to Firestore

## 2. User Interface

### 2.1 AI Assistant Navbar Button

- [ ] Ensure navbar button opens dedicated AI Assistant page (already implemented)

### 2.2 AI Assistant Circle on Feed

- [ ] Add small circle at bottom-left of feed page (same as 1.2)

### 2.3 Update Create Post Section

- [ ] Change tabs to separate buttons in `src/app/pages/feed/feed.html` for Text Post and Image Post
- [ ] Fix image upload functionality in `src/app/pages/image-post/image-post.ts` and related files

### 2.4 Ensure Messages to Admin Work

- [ ] Verify user messages reach admin's message history with contact info (already implemented)

## 3. Testing and Deployment

- [ ] Test admin and user post creation
- [ ] Test AI assistant responses
- [ ] Test message sending to admin
- [ ] Deploy Firebase functions
