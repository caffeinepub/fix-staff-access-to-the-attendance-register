# Specification

## Summary
**Goal:** Add a user verification process where new users must be approved by existing (verified) users before accessing the app.

**Planned changes:**
- Add a `status` field (pending, verified, rejected) to user profiles in the backend
- Migrate all existing users to `verified` status so they retain full access
- Add backend functions (`getPendingUsers`, `approveUser`, `rejectUser`) accessible only to verified users
- Show a "Waiting for Approval" screen to pending users and a rejection notice to rejected users instead of the dashboard
- Add a "User Verification" panel in the dashboard (visible to verified users only) that lists pending users with Approve and Reject buttons

**User-visible outcome:** New users who register are held in a pending state and see a waiting screen until an existing verified farm member approves them from a dedicated verification panel in the dashboard.
