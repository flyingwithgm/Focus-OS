## Firestore Sync Setup

This app syncs user data under:

- `users/{uid}/meta/profile`
- `users/{uid}/tasks/*`
- `users/{uid}/courses/*`
- `users/{uid}/events/*`
- `users/{uid}/blocks/*`
- `users/{uid}/sessions/*`
- `users/{uid}/moodLogs/*`
- `users/{uid}/semesters/*`
- `users/{uid}/notifications/*`

### Required Firebase Console step

1. Open Firebase Console
2. Go to Firestore Database
3. Open Rules
4. Paste the contents of `firestore.rules`
5. Publish the rules

### After publishing rules

1. Sign into FocusOS
2. On the device that has the correct data, let sync finish first
3. On other devices, use `Profile -> Reload Cloud Data`

That clears stale local cache and reloads from the signed-in cloud account.
