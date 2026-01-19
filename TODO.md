# TODO: Implement Nested Comments/Replies

## Steps to Complete

- [ ] Update Comment interface in `src/app/services/post.service.ts` to include `parentId?: string` and `communityName: string`
- [ ] Modify `addComment` method in `src/app/services/post.service.ts` to accept `parentId` and `communityName` parameters
- [ ] Add `newReplyText: { [commentId: string]: string } = {};` property in `src/app/pages/feed/feed.ts`
- [ ] Add `submitReply(comment: Comment)` method in `src/app/pages/feed/feed.ts`
- [ ] Add logic to build comment tree in `src/app/pages/feed/feed.ts` (group comments by parentId)
- [ ] Update `src/app/pages/feed/feed.html` to display comments recursively with reply inputs and indentation
- [ ] Update `firestore.rules` to check community match for comment creation
- [ ] Test comment submission, reply submission, and nested display
- [ ] Ensure real-time updates work for nested comments
