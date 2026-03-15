# V-PAY

## Current State
App has local storage-based server management. Admin Panel has a "Servers" tab that creates virtual local servers (just localStorage namespaces). User data (accounts, V balances) is stored only on the device. Account recovery works locally via phone + email match. There is no real cloud/server storage.

The ICP backend canister currently only handles authorization and basic user registration (phone, name). Balances and transactions are not stored on-chain.

## Requested Changes (Diff)

### Add
- Motoko backend: store user cloud records (phone, name, email, balance) in stable storage; admin-only functions to sync and manage cloud records; public recovery function by phone + email
- Admin Panel "Platform" tab: shows ICP canister info (already running, no domain needed), toggle to enable Cloud Mode (sync user data to canister), sync all users to cloud button, platform status display
- Cloud sync logic: when Cloud Mode is ON, every registration/balance change syncs to ICP canister
- Cloud recovery: on "Recover Old Account" screen, also check ICP canister records if local match fails

### Modify
- backend.d.ts: add balance storage, cloud user record type, recovery function, admin cloud management functions
- storage.ts: add cloudMode flag, sync helpers
- AdminPanel.tsx: replace Servers tab content with real Platform tab (ICP hosting info + cloud sync controls)
- OnboardingFlow / recovery: fall back to ICP canister for account recovery when local data not found

### Remove
- Nothing removed

## Implementation Plan
1. Generate Motoko backend with: CloudUserRecord type (phone, name, email, balance), registerCloud(phone, name, email), updateBalance(phone, balance), recoverByPhoneEmail(phone, email) -> Option<CloudUserRecord>, getAllCloudUsers() admin-only, clearCloudUser(phone) admin-only
2. Update frontend storage to add getCloudMode/setCloudMode flags
3. Update AdminPanel Servers tab -> Platform tab with ICP canister hosting explanation, cloud mode toggle, sync controls
4. Wire recovery flow to also query ICP canister
5. Validate and deploy
