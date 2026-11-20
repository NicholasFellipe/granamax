# Security Specification — GranaMax Firestore Rules

## 1. Data Invariants
1. **User Isolation & PII Protection**: A user document at `/users/{userId}` can only be read (`get`) and written by the authenticated user whose `request.auth.uid == userId`. Listing `/users` is strictly forbidden.
2. **Privilege Escalation Prevention**: Users cannot create their profile with `isPro: true`, nor can they elevate `isPro` from `false` to `true` via client updates.
3. **Strict Ownership**: Every document in `/transactions/{transactionId}` and `/investments/{investmentId}` MUST contain `userId == request.auth.uid` on creation and preserve `userId` immutably on update.
4. **Query Enforcement**: Collection `list` queries on `/transactions` and `/investments` MUST enforce `resource.data.userId == request.auth.uid` on the rule side.
5. **Temporal & Volumetric Bounds**: All strings have explicit `.size()` bounds, numeric amounts are bounded and positive, document IDs match `^[a-zA-Z0-9_\-]+$`, and server timestamps (`request.time`) are enforced on creation/update.

## 2. The "Dirty Dozen" Payloads
1. Unauthenticated read on `/users/userA` -> `PERMISSION_DENIED`
2. Cross-user read on `/users/userB` as `userA` -> `PERMISSION_DENIED`
3. Blanket `list` query on `/users` -> `PERMISSION_DENIED`
4. Create `/users/userA` with `isPro: true` -> `PERMISSION_DENIED`
5. Shadow update on `/users/userA` injecting `isAdmin: true` -> `PERMISSION_DENIED`
6. Update `/users/userA` attempting to flip `isPro` to `true` -> `PERMISSION_DENIED`
7. Create `/transactions/tx1` with `userId: "userB"` while signed in as `userA` -> `PERMISSION_DENIED`
8. Create `/transactions/tx1` with negative `amount: -50` -> `PERMISSION_DENIED`
9. Create `/transactions/tx1` with oversized `description` (> 120 chars) -> `PERMISSION_DENIED`
10. Unscoped `list` query on `/transactions` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`
11. Create `/transactions/invalid$id` with invalid characters in document ID -> `PERMISSION_DENIED`
12. Create `/investments/inv1` with `type: "invalid_type"` or forged `boughtAt` timestamp -> `PERMISSION_DENIED`
