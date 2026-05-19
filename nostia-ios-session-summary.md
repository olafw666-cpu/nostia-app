# Nostia iOS — Session Summary

## Critical Discovery: Wrong Source Directory

The previous session applied all code changes to `NostiaApp/` — a folder that **is not compiled by Xcode**. The actual Xcode build target is:

```
nostia-ios/nostia-ios/NOSTIA/NOSTIA/
```

The Xcode project (`NOSTIA/NOSTIA.xcodeproj`) uses `PBXFileSystemSynchronizedRootGroup` pointing at `NOSTIA/`. Every `.swift` file in that folder is automatically included in the build. Files in `NostiaApp/` are completely ignored by the compiler.

**Rule going forward: all iOS edits must go to `NOSTIA/NOSTIA/`, never `NostiaApp/`.**

---

## Repository Structure

```
nostia-app/                        ← parent repo (two remotes)
├── server.js                      ← Node/Express backend
├── nostia-ios/                    ← iOS git submodule
│   └── nostia-ios/
│       ├── NOSTIA/
│       │   ├── NOSTIA.xcodeproj/  ← THE Xcode project
│       │   └── NOSTIA/            ← ✅ actual Swift source (edit here)
│       │       ├── Models/
│       │       ├── Views/
│       │       ├── ViewModels/
│       │       ├── Network/
│       │       ├── Auth/
│       │       ├── Config/
│       │       └── Extensions/
│       └── NostiaApp/             ← ❌ dead copy — not compiled
├── nostia-android/                ← Android (Kotlin/Compose)
└── nostia-expo/                   ← Expo legacy — do not touch
```

### Git Remotes

| Remote | Repo | Used for |
|--------|------|----------|
| `origin` | `olafw666-cpu/nostia-app` | Primary GitHub remote |
| `appback` | `olafwoodall-sudo/Nostia_appback` | Production deploy source |

The iOS submodule has its own remote: `olafw666-cpu/nostia-ios.git` on branch `master`.

**Deploy order when pushing:**
1. Commit changes inside `nostia-ios/nostia-ios/` → push `origin master`
2. From parent repo: `git add nostia-ios` → commit → push `origin main` and `appback main`

---

## Session 13 — Vault Expense Split Selection

**Spec:** `vault_expense_split_spec.pdf`
**iOS commits:** `bb34bdb` (submodule) / `5aab383` (parent)
**Backend commits:** `5aab383` pushed to `origin main` and `appback main`
**Production deploy:** `git pull appback main && pm2 restart nostia` (no `npm install` needed — pure JS logic change)

---

### Feature Overview

Added a member selection section to the Add Expense screen. The expense adder can choose which vault members share the expense and assign amounts per person. Split is locked permanently once the expense is saved.

---

### New Model — `ExpenseSplitInput`

**File:** `Models/VaultModels.swift`

```swift
struct ExpenseSplitInput: Codable {
    let userId: Int
    let amount: Double
}
```

Used to carry per-member split data from the UI to the API call.

---

### API & ViewModel Changes

**File:** `Network/API/VaultAPI.swift` — `createEntry`

Added `splits: [ExpenseSplitInput]` parameter. Sends splits in the POST body as `[["userId": Int, "amount": Double]]`.

**File:** `ViewModels/VaultViewModel.swift` — `addExpense`

Added `splits: [ExpenseSplitInput]` parameter and forwards it to `VaultAPI.shared.createEntry`.

---

### iOS UI — `CreateExpenseSheet` Rewrite

**File:** `Views/Components/SharedComponents.swift`

**Signature change:**
```swift
// Before
struct CreateExpenseSheet: View {
    let tripId: Int
    var showCategory: Bool = true
    let onSave: (String, Double, String?, String) async -> Void

// After
struct CreateExpenseSheet: View {
    let tripId: Int
    let members: [TripParticipant]
    var showCategory: Bool = true
    let onSave: (String, Double, String?, String, [ExpenseSplitInput]) async -> Void
```

**New state:**
```swift
@State private var selectedMemberIds: Set<Int> = []
@State private var memberAmounts: [Int: String] = [:]
@State private var isCustomMode = false
```

**"Split Between" section added at the bottom of the form:**

- **Everyone toggle** — master toggle above member rows. Selects/deselects all. Appears active (filled checkmark) only when all members selected.
- **Member rows** — one per active (non-kicked) participant. Shows avatar, `@username (you)` label, amount TextField, circle/checkmark indicator. Tapping the row toggles selection; tapping the TextField edits the amount.
- **"Split Evenly" button** — appears in the section header only when `isCustomMode = true`. Resets all selected members to even split and clears custom mode.
- **Split total indicator** — `"$X.XX of $Y.YY"` at the bottom of the section. Green when totals match, red when they don't.
- **Inline $0 error** — `"Amount must be greater than $0."` shown below any selected member row whose amount is ≤ 0.
- **Minimum member error** — `"At least 1 member must be included in the split."` shown when no members selected.

**Even split mode (default):**
- Initialised on `.onAppear` — all active members selected, amounts computed immediately.
- Recomputes whenever `amountText` changes (`.onChange`) or member selection changes.
- Rounding: integer cent arithmetic. `totalCents / count` base, remainder cents distributed to first member(s) in list order. Total always equals expense total exactly.

**Custom split mode:**
- Triggered when user manually edits any amount TextField (via the Binding's `set` closure).
- Amounts no longer auto-recompute when selection changes.
- Members deselected in custom mode have their amount removed from the assigned total; remaining amounts are NOT rebalanced.
- When expense total changes in custom mode: indicator shows mismatch, no auto-recompute.

**Validation (`splitIsValid`):**
- At least 1 member selected.
- No selected member has a ≤ $0 amount.
- `abs(assignedTotal - expenseAmount) < 0.005` — totals must match within half a cent.
- Save button is disabled while `saveDisabled` (also guards empty description / zero amount / saving in progress).

**Even split computation:**
```swift
let totalCents = Int(round(expenseAmount * 100))
let base = totalCents / selected.count
let remainder = totalCents % selected.count
for (i, member) in selected.enumerated() {
    let cents = base + (i < remainder ? 1 : 0)
    memberAmounts[member.id] = String(format: "%.2f", Double(cents) / 100.0)
}
```

**Programmatic vs. user amount changes:** The `isCustomMode = true` flag is only set inside the Binding's `set` closure (i.e. user typing). Direct mutations to `memberAmounts` in `recomputeEvenSplit()` go via the dictionary directly and do not trigger the Binding's `set`, so they never accidentally switch to custom mode. No `isRecomputing` guard needed.

---

### View Wiring

**File:** `Views/Vault/VaultView.swift` — `VaultContentView`

Added `var participants: [TripParticipant] = []`. The `CreateExpenseSheet` sheet now passes `members: participants` and the updated `onSave` closure receives and forwards `splits`.

**File:** `Views/Vault/VaultDetailView.swift`

```swift
// Before
VaultContentView(tripId: currentTrip.id, isKicked: isKicked)

// After
VaultContentView(tripId: currentTrip.id, isKicked: isKicked, participants: currentTrip.activeParticipants)
```

`currentTrip.activeParticipants` filters out kicked members (`status != "kicked"`). If participants are empty for any reason, the split section shows the minimum-member error and Save stays disabled — safe fallback.

---

### Backend — `POST /api/vault` Validation

**File:** `server.js`

When client provides explicit splits, the route now validates before creating the entry:

```js
if (finalSplits.length < 1) {
  return res.status(400).json({ error: 'At least 1 member must be included in the split.' });
}
if (finalSplits.some(s => !s.amount || s.amount <= 0)) {
  return res.status(400).json({ error: 'All split amounts must be greater than $0.' });
}
const splitTotal = finalSplits.reduce((sum, s) => sum + s.amount, 0);
if (Math.abs(splitTotal - amount) > 0.02) {
  return res.status(400).json({ error: 'Split amounts must equal the expense total.' });
}
// Mark paidBy as already paid
finalSplits = finalSplits.map(s => ({
  ...s,
  paid: Number(s.userId) === Number(paidBy),
}));
```

Auto-split fallback (no splits provided) is preserved unchanged. Minimum was initially set to 2, then immediately changed to 1 per product decision.

---

### Files Modified (Session 13)

| File | Change |
|------|--------|
| `Models/VaultModels.swift` | Added `ExpenseSplitInput` struct |
| `Network/API/VaultAPI.swift` | `createEntry` accepts and sends `splits: [ExpenseSplitInput]` |
| `ViewModels/VaultViewModel.swift` | `addExpense` accepts and forwards `splits: [ExpenseSplitInput]` |
| `Views/Components/SharedComponents.swift` | `CreateExpenseSheet` rewritten: `members` param, updated `onSave` signature, full split selection UI, even/custom split logic, validation |
| `Views/Vault/VaultView.swift` | `VaultContentView` gains `participants` param; `CreateExpenseSheet` call updated |
| `Views/Vault/VaultDetailView.swift` | Passes `currentTrip.activeParticipants` to `VaultContentView` |
| `server.js` | `POST /api/vault`: validates client-provided splits (min 1, no $0, total must match) |

---

## Session 12 — Dev Account Setup & Permissions

**iOS commits:** `ee16e05` pushed to submodule `master` / `a555787` (parent)
**Backend changes:** None (DB only — no server.js edits)
**Production deploy:** Not required for server; DB updated directly via SSH

> ⚠️ **CRITICAL: iOS changes landed in `NostiaApp/` (not compiled).** All 12 Swift files committed this session are in `nostia-ios/nostia-ios/NostiaApp/` — the dead copy that Xcode ignores. They must be re-applied to `nostia-ios/nostia-ios/NOSTIA/NOSTIA/` before they will take effect. See the ongoing notes at the bottom of this document.

---

### Part 1 — Setting `account_type = 'dev'` in Databases

**Local DB (`c:\nostia-app\database\nostia.db`):**
- The `account_type` column did not exist locally — added it via `ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'user'`.
- Set `Olaf` (id: 4, username `Olaf`) to `account_type = 'dev'`.

**Production DB discovery:**
- The server's `database/db.js` reads `process.env.DB_PATH || path.join(__dirname, 'nostia.db')`.
- PM2 env has `DB_PATH=/var/data/nostia/nostia.db` — the live database is **not** `/var/www/nostia-backend/database/nostia.db`. The file at the backend path is a stale seed-only copy (3 users). The real DB at `/var/data/nostia/nostia.db` had 18 real users.
- Set `olaf` (id: 6, username `olaf`) to `account_type = 'dev'` in `/var/data/nostia/nostia.db`.

**Backups:** `/var/backups/nostia/` contains daily `.db` snapshots.

---

### Part 2 — Why Dev Permissions Weren't Working in the App

**Root cause:** The `User` struct in `Models/User.swift` had no `account_type` field and no `CodingKeys` entry for it. Even though `User.findById()` in `models/User.js` does `SELECT u.*` (which includes `account_type`), Swift's `JSONDecoder` silently ignores unknown keys — so the field was always `nil` in the app and there was no `isDev` computed property anywhere.

**Server-side is correct:** `requireDev` middleware does a fresh DB query on every request (`SELECT account_type FROM users WHERE id = ?`), so the DB update takes effect immediately without a restart.

---

### Part 3 — iOS Changes Required (Applied to Wrong Directory)

The following changes were implemented but committed to `NostiaApp/` instead of `NOSTIA/NOSTIA/`. They are **not compiled**. Re-apply each to the corresponding path under `NOSTIA/NOSTIA/`:

| File | Change |
|------|--------|
| `Models/User.swift` | Add `var accountType: String?`; add `case accountType = "account_type"` to `CodingKeys`; add `var isDev: Bool { accountType == "dev" }` |
| `Auth/AuthManager.swift` | Add `@Published var isDev: Bool = false` |
| `Views/MainTabView.swift` | `loadUserRole()` now also sets `AuthManager.shared.isDev = user?.isDev ?? false` |
| `Network/API/FeedAPI.swift` | Add `adminDeletePost(id: Int)` → `DELETE /admin/posts/:id` |
| `ViewModels/FeedViewModel.swift` | Add `adminDeletePost(id: Int)` method |
| `Views/Feed/PostCard.swift` | Add `isCurrentUserDev: Bool = false` param; show trash button if `post.userId == currentUserId || isCurrentUserDev` |
| `Views/Feed/FeedView.swift` | Pass `authManager.isDev` to `PostCard`; route to `adminDeletePost` when dev and not own post |
| `Network/API/AdventuresAPI.swift` | Add `adminDeleteEvent(id: Int)` and `adminDeleteUser(id: Int)` |
| `ViewModels/HomeViewModel.swift` | Add `adminDeleteEvent(id: Int)` — removes from all three event arrays |
| `Views/Home/HomeView.swift` | `EventPreviewCard` and `EventGoingCard` gain `isCurrentUserDev` + `onDelete` params with `.contextMenu` delete option (long press) |
| `ViewModels/FriendsViewModel.swift` | Add `adminDeleteUser(id: Int)` — removes from `friends` and `searchResults` |
| `Views/Friends/FriendsView.swift` | Add `@EnvironmentObject var authManager: AuthManager`; `FriendRow` and `UserSearchRow` gain `isCurrentUserDev` + `onDelete` params with `.contextMenu` delete option (long press) |

**How dev permissions surface in the UI (once applied to correct directory):**
- **Posts:** Trash icon appears on any post (not just own) when signed in as dev.
- **Events:** Long-press any event card on Home screen → "Delete Event" context menu item.
- **Users:** Long-press any friend row or search result → "Delete User" context menu item.

---

## Session 11 — Bug Fixes: Delete Account & Payment Setup

**Backend commits:** `6e43501` pushed to `origin main` and `appback main`
**Files changed:** `server.js`, `services/stripeService.js`
**Production deploy:** `git stash && git pull origin main && pm2 restart nostia` (stash required — package-lock.json was dirty on droplet)

---

### Fix 1 — Delete Account Cascade Error

**Symptom:** Tapping "Delete Account" → confirming both alerts → error banner: *"Something went wrong. Your account was not deleted. Please try again."*

**File:** `server.js` — `DELETE /api/users/me` handler

**Root cause:** The transaction used `DELETE FROM trips WHERE vaultLeaderId = ?` to clear the `trips.vaultLeaderId` FK reference before deleting the user. Deleting those trips triggers a cascade chain (vault_entries → vault_splits → vault_transactions) that can conflict with the subsequent user-level cascade (which also walks the same chain via `trips.createdBy`, `vaults.owner_id`, etc.). SQLite's deferred FK enforcement can deadlock or miss rows in complex multi-path cascade graphs, causing the transaction to throw and return 500.

**Fix:** Replace the DELETE with an UPDATE that nulls the reference:

```js
// Before
db.prepare('DELETE FROM trips WHERE vaultLeaderId = ?').run(userId);

// After
db.prepare('UPDATE trips SET vaultLeaderId = NULL WHERE vaultLeaderId = ?').run(userId);
```

Nulling `vaultLeaderId` removes the FK reference without triggering any cascade. The trip survives for other participants. The `DELETE FROM users WHERE id = ?` that follows then performs a single, clean cascade walk with no conflicting paths.

**Note:** The admin hard-delete route (`DELETE /api/admin/users/:id`) still uses the original `DELETE FROM trips WHERE vaultLeaderId = ?` approach — that is intentional because the admin route does a full cascade-inclusive wipe, and the admin user can never delete themselves (guarded by a 400 check).

---

### Fix 2 — "Failed to create payment setup" on Add Card

**Symptom:** Tapping "Add Card" on the Payment Methods screen → error banner: *"Failed to create payment setup. Please try again."* (server 500).

**File:** `server.js` — `POST /api/stripe/setup-intent`

**Root cause:** Session 10 removed the per-call `{ apiVersion: '2024-04-10' }` override on `stripe.ephemeralKeys.create()`, leaving it to inherit the global `apiVersion: '2025-09-30.preview'`. Stripe's ephemeral key endpoint does not support this preview version and returns a 400 error, which the catch block converts into a 500 to the iOS app.

Ephemeral keys carry the API version as part of their signed payload. The Stripe iOS SDK PaymentSheet (v22) validates that this version matches what the SDK declares. The version must be pinned to what the SDK expects — **it cannot follow the server's global version**.

**Fix:** Restore the per-call version override:

```js
// Before
stripe.ephemeralKeys.create({ customer: customerId })

// After
stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2024-04-10' })
```

Same fix applied to both vault payment-intent routes (single split and bulk), where `{ stripeAccount }` was already being passed as options:

```js
// Before
stripe.ephemeralKeys.create({ customer: customerId }, { stripeAccount: payer.stripe_account_id })

// After
stripe.ephemeralKeys.create({ customer: customerId }, { stripeAccount: payer.stripe_account_id, apiVersion: '2024-04-10' })
```

Those vault-route failures were non-fatal (empty catch), so they didn't produce visible errors — but the PaymentSheet would initialize without customer context, meaning saved cards wouldn't appear.

---

### Fix 3 — Onboarding Status Always Shows "Not set up"

**Symptom:** Payout Account shows "Not set up" even after completing Stripe onboarding.

**File:** `services/stripeService.js` — `checkOnboardingComplete()`

**Root cause:** The method called `stripe.accounts.retrieve(user.stripe_account_id)` (v1 API) and checked `account.details_submitted`. v1 cannot retrieve v2 Core account IDs — it throws a "No such account" error, the onboarding status endpoint returned 500 (silently swallowed by `try?` on the iOS side), and `onboardingStatus` stayed `nil`, showing "Not set up". This was flagged as "Pending Verification" in the Session 10 notes.

**Fix:**

```js
// Before
const account = await stripe.accounts.retrieve(user.stripe_account_id);
const complete = account.details_submitted;

// After
const account = await stripe.v2.core.accounts.retrieve(user.stripe_account_id);
const complete = account.operational_status === 'active';
```

---

### Files Modified (Session 11)

| File | Change |
|------|--------|
| `server.js` | `DELETE /api/users/me`: UPDATE vaultLeaderId = NULL instead of DELETE trips; `stripe/setup-intent` + both vault PI routes: `apiVersion: '2024-04-10'` on all `ephemeralKeys.create()` calls |
| `services/stripeService.js` | `checkOnboardingComplete`: v2 account retrieve + `operational_status === 'active'` check |

---

## Session 10 — Stripe Connect V2 Migration

**Backend commits:** `cdfd0c7` pushed to `origin main` and `appback main`
**Files changed:** `package.json`, `server.js`, `services/stripeService.js`
**Production deploy:** `cd /var/www/nostia-backend && git pull appback main && npm install && pm2 restart nostia`
**Spec:** `stripe_v2_migration_spec.pdf` — Direct charge model, Stripe-Version: 2025-09-30.preview

---

### Overview

Migrated Vault payment infrastructure from Stripe Connect v1 (destination charges) to Stripe Connect v2 Core accounts (direct charges). Destination charges are fully removed. All PaymentIntents now live on the connected account. No platform fees implemented — this is a deliberate product decision.

---

### Change 1 — Stripe SDK Upgrade

**File:** `package.json`

Upgraded from `stripe ^14.25.0` → `stripe ^17.0.0`. Required for `stripe.v2.core.accounts` API access. Run `npm install` after deploy.

---

### Change 2 — Global API Version Header

**Files:** `services/stripeService.js` (line 2), `server.js` (5 inline instances)

Every `new Stripe(process.env.STRIPE_SECRET_KEY)` now passes `{ apiVersion: '2025-09-30.preview' }` as the second argument. All per-call `{ apiVersion: '2024-04-10' }` overrides on `ephemeralKeys.create()` removed — global version covers them.

```js
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.preview' });
```

---

### Change 3 — Account Creation: v1 → v2 Core

**File:** `services/stripeService.js` — `createConnectAccount()` (line 20)

Replaced `stripe.accounts.create({ type: 'standard', business_type: 'individual', ... })` with `stripe.v2.core.accounts.create(...)` using the `configuration` object:

```js
static async createConnectAccount(userInfo = {}) {
  const params = {
    configuration: { merchant: {}, recipient: {} }
  };
  if (userInfo.name) params.display_name = userInfo.name;
  if (userInfo.email) params.contact_email = userInfo.email;
  if (userInfo.firstName || userInfo.lastName || userInfo.email) {
    params.identity = {
      individual: {
        ...(userInfo.firstName || userInfo.lastName ? {
          name: { given_name: userInfo.firstName, family_name: userInfo.lastName }
        } : {}),
        ...(userInfo.email ? { email: userInfo.email } : {})
      }
    };
  }
  return stripe.v2.core.accounts.create(params);
}
```

`getOrCreateConnectAccount()` now also passes `name` for `display_name`. Do NOT pass `type`, `business_type`, or `individual` at the top level — v2 accounts use `configuration` objects instead.

**Key:** `merchant` configuration enables the account to be charged directly; `recipient` enables receiving funds. Both applied to every account (users can be both payer and vault owner).

---

### Change 4 — Direct Charges (Remove Destination Charges)

**Files:** `server.js` (single split + bulk routes), `services/stripeService.js` (legacy vault PI)

All `transfer_data: { destination: accountId, amount: ... }` blocks removed. The vault owner's `stripe_account_id` is now passed as the `stripeAccount` header on the PaymentIntent `create` (and `retrieve`) call instead:

```js
// Before (destination charge)
intentParams.transfer_data = { destination: payer.stripe_account_id, amount: Math.round(split.amount * 100) };
const intent = await stripe.paymentIntents.create(intentParams);

// After (direct charge)
const stripeAccountOpts = payer?.stripe_account_id && payer.onboarding_complete
  ? { stripeAccount: payer.stripe_account_id }
  : {};
const intent = await stripe.paymentIntents.create(intentParams, stripeAccountOpts);
```

The `payer` lookup (vault owner's connected account) was moved **before** the existing PI reuse block in the single-split route so the `stripeAccount` header is available for both `retrieve` and `create`.

**Implications accepted per spec:**
- Disputes are the connected account's (vault owner's) responsibility
- Refunds must be initiated from the connected account
- `charge.dispute.created` webhook still fires and vault freeze logic is unchanged
- `transfer.created` webhook handler left in place but will no longer fire (no transfers in direct charge model)

---

### Change 5 — Ephemeral Key & Customer on Connected Account

**File:** `server.js` — single split PI route and bulk PI route

Previously ephemeral keys used the platform-account `stripe_customer_id` stored on the user record. Under direct charges the customer must exist on the connected account. Both routes now create a fresh ephemeral customer on the vault owner's connected account:

```js
if (payer?.stripe_account_id && payer.onboarding_complete) {
  try {
    const connectedCustomer = await stripe.customers.create(
      { metadata: { payerUserId: String(req.user.id) } },
      { stripeAccount: payer.stripe_account_id }
    );
    customerId = connectedCustomer.id;
    const ek = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { stripeAccount: payer.stripe_account_id }
    );
    ephemeralKeySecret = ek.secret;
  } catch (_) { /* non-fatal */ }
}
```

The `stripe_customer_id` column on `users` is now only used by the `setup-intent` / payment-methods routes (platform account context). Those routes are de-facto decoupled from the PaymentSheet flow — the "no saved card" prompt in iOS may not trigger correctly, but payment itself works.

---

### Change 6 — Webhook: v2.core.account.updated

**File:** `services/stripeService.js` — `handleWebhook()` (line 204)

Added new case (no existing `account.updated` handler was present to remove):

```js
case 'v2.core.account.updated': {
  const account = event.data.object;
  const complete = account.requirements?.paused_reason === null
    || account.operational_status === 'active';
  if (complete) {
    db.prepare('UPDATE users SET onboarding_complete = 1 WHERE stripe_account_id = ?')
      .run(account.id);
  }
  break;
}
```

**Stripe Dashboard manual steps required:**
- Webhook endpoint scope: change to "Your account" (from "Connected accounts")
- Subscribed events: add `v2.core.account.updated`; remove `account.updated` if listed

---

### Pending Verification (post-deploy)

- `checkOnboardingComplete()` in `stripeService.js` still calls `stripe.accounts.retrieve()`. If this fails with v2 account IDs, update to `stripe.v2.core.accounts.retrieve()` and check `account.operational_status === 'active'` instead of `account.details_submitted`.
- End-to-end test: create vault → complete onboarding → make payment → confirm direct charge appears on connected account's Stripe dashboard (not platform).

---

### Pre-Deploy Checklist (manual)

1. Delete all existing test connected accounts from Stripe Dashboard
2. `sqlite3 database/nostia.db "UPDATE users SET stripe_account_id = NULL, onboarding_complete = 0;"`
3. `git pull appback main && npm install && pm2 restart nostia`
4. Update Stripe Dashboard webhook settings (scope + events)

---

### Files Modified (Session 10)

| File | Change |
|------|--------|
| `package.json` | `stripe` upgraded `^14.25.0` → `^17.0.0` |
| `services/stripeService.js` | Global `apiVersion`; v2 account creation; direct charge on legacy vault PI; `v2.core.account.updated` webhook handler |
| `server.js` | `apiVersion` on all 5 inline Stripe instances; payer lookup moved before PI reuse; `transfer_data` removed; `stripeAccount` header on PI create/retrieve; customer + ephemeral key on connected account |

---

## Session 9 — Bug Fixes: Image Upload Size, Map Location, Home Events, Feed Interactions

**iOS commits:** Two rounds pushed to submodule (`master`) and parent (`origin main` + `appback main`).

---

### Fix 1 — "Request Too Large" When Posting / "Failed to Upload Flyer"

**File:** `Extensions/UIImage+Resize.swift`

**Root cause:** `UIGraphicsImageRenderer` defaults to the device's screen scale (3× on iPhone 14 Pro). `resizedForUpload(maxDimension: 800)` was computing bounds in points but rendering at 3× scale, producing images up to 2400×2400 px (~4–6 MB) instead of 800×800 px. This exceeded Nginx's default `client_max_body_size` (1 MB) and the server's Express limit, causing 413 responses.

**Fix:** Measure in actual pixels (`size.width * scale`) and render at `scale = 1.0`:

```swift
func resizedForUpload(maxDimension: CGFloat = 800) -> UIImage {
    let pixelW = size.width * scale
    let pixelH = size.height * scale
    let maxSide = max(pixelW, pixelH)
    guard maxSide > maxDimension else { return self }
    let ratio = maxDimension / maxSide
    let newSize = CGSize(width: (pixelW * ratio).rounded(), height: (pixelH * ratio).rounded())
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1.0
    let renderer = UIGraphicsImageRenderer(size: newSize, format: format)
    return renderer.image { _ in draw(in: CGRect(origin: .zero, size: newSize)) }
}
```

**Note:** `UIImage.size` is in points, not pixels. Always multiply by `.scale` to get actual pixel dimensions before using them for upload/compression decisions.

---

### Fix 2 — Map Always Opens to San Francisco

**File:** `Views/Friends/FriendsMapView.swift`

Added `@EnvironmentObject private var locationManager: LocationManager` and set the camera to the user's already-known location in `.task`:

```swift
.task {
    await loadAll()
    if let loc = locationManager.location {
        cameraPosition = .region(MKCoordinateRegion(
            center: loc.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.2, longitudeDelta: 0.2)
        ))
    }
}
```

Same fix applied to `CreateEventFromDiscoverSheet` in `Views/Events/EventsView.swift`.

---

### Feature — Home Page Event Sections

**File:** `Views/Home/HomeView.swift`

Added two independent event sections (not if/else — both show when data is available):

```swift
if !vm.nearbyEvents.isEmpty {
    SectionHeader(title: "Nearby Events")
    ForEach(vm.nearbyEvents.prefix(3)) { event in
        Button { activeSheet = .eventDetail(event) } label: {
            EventPreviewCard(event: event)
        }.buttonStyle(.plain)
    }
}
if !vm.upcomingEvents.isEmpty {
    SectionHeader(title: "Events You're Going To")
    ForEach(vm.upcomingEvents.prefix(3)) { event in
        Button { activeSheet = .eventDetail(event) } label: {
            EventPreviewCard(event: event)
        }.buttonStyle(.plain)
    }
}
```

Event cards are now tappable — they open `EventDetailSheet` via the unified `HomeSheet` enum (see Fix 3 below).

---

### Feature — Events Tab: Going Events at Top

**File:** `Views/Events/EventsView.swift`

`EventsViewModel` now loads both all events and going events concurrently:

```swift
@Published var goingEvents: [Event] = []

func loadAll() async {
    async let allTask = AdventuresAPI.shared.getAllEvents()
    async let goingTask = AdventuresAPI.shared.getMyGoingEvents()
    let fresh = (try? await allTask) ?? []
    let freshGoing = (try? await goingTask) ?? []
    if !fresh.isEmpty { events = fresh; await CacheManager.shared.set(...) }
    goingEvents = freshGoing
    isLoading = false
}
```

`otherEvents` computed property prevents duplicates: `vm.events.filter { !goingIds.contains($0.id) }`.

Sectioned list: "Going" section (green `Color.nostiaSuccess` header) at top, then "Nearby Events" / "All Events" below.

---

### Fix 3 — Likes/Comments Broken (Double Sheet Conflict)

**File:** `Views/Home/HomeView.swift`

**Root cause:** Two separate `.sheet(item:)` modifiers on the same `ScrollView` — SwiftUI only processes the last one. Adding `$selectedHomeEvent` for event detail silently shadowed the existing comments sheet, making likes and comments appear to do nothing.

**Fix:** Consolidated into a single `HomeSheet` enum with one sheet modifier:

```swift
private enum HomeSheet: Identifiable {
    case comments(FeedPost)
    case eventDetail(Event)
    var id: String {
        switch self {
        case .comments(let p): return "c\(p.id)"
        case .eventDetail(let e): return "e\(e.id)"
        }
    }
}
@State private var activeSheet: HomeSheet?

.sheet(item: $activeSheet) { sheet in
    switch sheet {
    case .comments(let post):
        CommentsSheet(postId: post.id, vm: feedVM)
            .onAppear { Task { await feedVM.loadComments(for: post) } }
    case .eventDetail(let event):
        EventDetailSheet(event: event, vm: eventActionsVM)
    }
}
```

**Rule:** Never use two `.sheet(item:)` (or `.sheet(isPresented:)`) on the same SwiftUI view — only the last one is processed. Consolidate with an enum.

---

### Fix 4 — Flyer / Post Image Overflowing Screen

**Files:** `Views/Friends/EventSheets.swift`, `Views/Feed/PostCard.swift`

**Root cause:** `.scaledToFill()` combined with `.frame(maxWidth: .infinity)` does not establish hard layout bounds — `.clipped()` only clips rendering, not the layout frame, so images broke out of their containers horizontally.

**Fix:** `Color.clear` container overlay pattern — the transparent container establishes the frame; the image fills it and is clipped:

```swift
Color.clear
    .frame(maxWidth: .infinity, height: 200)
    .overlay(Image(uiImage: uiImage).resizable().scaledToFill())
    .clipped()
```

Applied in `EventDetailSheet` (200px, padded, rounded corners), `EventFlyerView` (340px, full-width), and `PostCard` (200px). Use this pattern everywhere an image must fill a fixed frame without overflowing.

---

### Files Modified (Session 9)

| File | Change |
|------|--------|
| `Extensions/UIImage+Resize.swift` | Fixed pixel-space calculation; `format.scale = 1.0` — output is now exactly `maxDimension` pixels regardless of device screen scale |
| `Views/Home/HomeView.swift` | `HomeSheet` enum; single `.sheet(item: $activeSheet)`; tappable event cards; "Nearby Events" + "Events You're Going To" sections; `eventActionsVM` state |
| `Views/Events/EventsView.swift` | `goingEvents` published property; concurrent `loadAll()`; `otherEvents` filter; sectioned list with "Going" / "Nearby Events" headers; `CreateEventFromDiscoverSheet` locationManager camera fix |
| `Views/Friends/FriendsMapView.swift` | `locationManager` env object; `.task` sets camera from known location |
| `Views/Friends/EventSheets.swift` | `Color.clear` overlay pattern for `EventDetailSheet` header image and `EventFlyerView` full-screen image |
| `Views/Feed/PostCard.swift` | `Color.clear` overlay pattern for post image |

---

## Stripe Connect Onboarding Fix (Session 8)

**Backend commits:** `bbbe161` (business_type: individual added to standard) → `9cf616b` (switched to express) → reverted to standard+prefill (uncommitted, matches Session 7 Section 5 final state)  
**Production deploy:** Deployed after each commit; final uncommitted revert not yet deployed separately.

---

### Stripe Connect Business Account Bug

**Symptom:** Vault creator's "Setup Stripe" flow opened Stripe's hosted onboarding page showing business account options (EIN, company details) instead of an individual/personal flow.

**Root cause:** `createConnectAccount()` in `services/stripeService.js` only passed `{ type: 'standard' }` — no `business_type`. Stripe's hosted onboarding for `standard` accounts defaults to a business-first flow regardless.

**Diagnosis:** Confirmed no users had an existing `stripe_account_id` in the DB (so the fix always ran). The issue is a Stripe platform behavior: `standard` Connect accounts use Stripe's fully-hosted UI which ignores the `business_type` field on the account object — it always presents business options first.

**Fix attempts:**

1. Added `business_type: 'individual'` to the `standard` account create call (`bbbe161`) — still showed business UI (standard accounts ignore it).
2. Switched to `type: 'express'` with `business_type: 'individual'` (`9cf616b`) — Express accounts honour `business_type` in their hosted onboarding.
3. Reverted to `standard` with `business_type: 'individual'` + individual name/email pre-fill from DB (current state, uncommitted). `getOrCreateConnectAccount` now also fetches `name` and `email` to pass as `individual.first_name`, `individual.last_name`, `individual.email`.

**Current state** (matches Session 7 Section 5):
```js
static async createConnectAccount(userInfo = {}) {
  const params = { type: 'standard', business_type: 'individual' };
  const individual = {};
  if (userInfo.firstName) individual.first_name = userInfo.firstName;
  if (userInfo.lastName)  individual.last_name  = userInfo.lastName;
  if (userInfo.email)     individual.email       = userInfo.email;
  if (Object.keys(individual).length > 0) params.individual = individual;
  return stripe.accounts.create(params);
}
```

**If standard still shows business UI:** Switch to `type: 'express'` in the code AND enable Express accounts in Stripe Dashboard → Connect → Settings. Express gives full control over `business_type` pre-selection; the trade-off is users get a limited Stripe Express dashboard instead of a full Stripe account.

---

## Bug Fixes & UI Updates (Session 7)

**Spec:** "Bug Fixes & UI Updates — Engineering Specification" (5 sections)  
**iOS commits:** `5a662d3` (submodule) / `061d335` (parent)  
**Backend commits:** `061d335` on `origin main` + `appback main` — `models/Event.js`, `services/stripeService.js`  
**Production deploy needed:** SSH to `142.93.116.6` → `cd /var/www/nostia-backend && git pull origin main && pm2 restart nostia`

---

### Section 1 — Event Cover Photo Race Condition

**File:** `Views/Events/EventsView.swift`

**Root cause:** `onChange(of: selectedCoverPhoto)` starts an async Task that sets `coverImageData`, but the Create button could fire before the task completed — submitting the event with no cover image.

**Fix:**
- Added `@State private var isCoverPhotoLoading = false`
- PhotosPicker button shows `ProgressView` while loading and is `.disabled(isCoverPhotoLoading)`
- Create button is `.disabled(isLoading || title.isEmpty || isCoverPhotoLoading)`
- `onChange` sets `isCoverPhotoLoading = true` at start and `defer { isCoverPhotoLoading = false }` at end
- Added size validation: rejects images > 4 MB after compression, shows `errorMessage`
- `visibilityOptions` changed from `["public", "friends", "private"]` → `["public", "followers", "private"]`
- Visibility description: `"Only your followers"` (was `"Only your friends"`)

---

### Section 2 — Flyer Upload Errors Now Visible

**File:** `Views/Friends/EventSheets.swift`

**Root cause:** `uploadFlyer()` used `try?` throughout — any network error, decode failure, or oversized image was silently swallowed. The user saw nothing happen.

**Fix:**
- Added `@State private var flyerError: String?` to `EventDetailSheet`
- Error text displayed below the PhotosPicker button when non-nil
- Rewrote `uploadFlyer()` with `do/catch` and explicit error messages:
  - `"Failed to load image. Please try again."` — decode failure
  - `"Image is too large. Please choose a smaller file."` — > 4 MB after compression
  - `"Failed to upload flyer. Please try again."` — API error
- `flyerError = nil` cleared at start of each upload attempt

---

### Section 3 — Friends → Followers Terminology

**iOS files:** `Views/Friends/FriendsMapView.swift` (`CreateEventSheet` + `EventMapPin`), `Views/Friends/EventSheets.swift`

- `CreateEventSheet.visibilityOptions` changed to `["public", "followers", "private"]`
- Visibility description: `"Only your followers"` (was `"Only your friends"`)
- `EventMapPin.typeColor` now handles both legacy `"friends"` and new `"followers"` values:
  ```swift
  case "friends", "followers": return Color.nostriaPurple
  ```
- `EventCard` visibility label in `EventSheets.swift` also handles both values:
  ```swift
  let isFollower = vis == "friends" || vis == "followers"
  Label(isFollower ? "Followers" : "Private", systemImage: isFollower ? "person.2" : "lock")
  ```

**Backend file:** `models/Event.js`

Three bugs fixed:

1. **`getAll()` queried the `friends` table** (wrong — app uses `follows` table). Fixed to use `follows` with correct column names (`follower_id`, `followee_id`). Also handles both `'friends'` and `'followers'` visibility values with `IN (...)`. Reduced params from 5→4.

2. **`getMapEvents()` Priority 2 showed all events by followed users** regardless of visibility. Fixed to gate on `visibility IN ('friends', 'followers')` before the EXISTS check.

3. **`findById()` had no visibility access control** — any authenticated user could fetch any event by ID. Added `canViewEvent(event, requestingUserId)` static method and wired it into `findById()` (returns `null` for unauthorized access).

---

### Section 4 — 10-Minute Periodic Location Sync

**Files:** `Location/LocationManager.swift`, `Views/Home/HomeView.swift`

**`LocationManager.swift`:**
- Added `private var periodicTimer: Timer?` and `private let syncInterval: TimeInterval = 600`
- `startPeriodicSync()`: fires `requestLocationIfAuthorized()` immediately, then every 10 minutes via `Timer` on `RunLoop.main` (`.common` mode so it fires while scrolling)
- `stopPeriodicSync()`: invalidates and nils the timer
- `requestLocationIfAuthorized()`: private helper — calls `manager.requestLocation()` only if authorized

**`HomeView.swift`:**
- Added `@Environment(\.scenePhase) private var scenePhase`
- `.task` changed from `locationManager.requestLocationOnce()` → `locationManager.startPeriodicSync()`
- Added scenePhase handler: `startPeriodicSync()` on `.active`, `stopPeriodicSync()` on `.background`
- Profile picture in welcome header: `ProfilePictureView(size: 44)` → `ProfilePictureView(size: 88)`

---

### Section 5 — Stripe Connect Type: Standard

**File:** `services/stripeService.js`

**Change:** `createConnectAccount()` changed from `type: 'express'` to `type: 'standard'` (with `business_type: 'individual'` already set from a prior session fix).

`getOrCreateConnectAccount()` now fetches `name` and `email` from the DB and passes them to `createConnectAccount()` so the standard onboarding form is pre-filled:

```js
static async createConnectAccount(userInfo = {}) {
    const params = { type: 'standard', business_type: 'individual' };
    const individual = {};
    if (userInfo.firstName) individual.first_name = userInfo.firstName;
    if (userInfo.lastName) individual.last_name = userInfo.lastName;
    if (userInfo.email) individual.email = userInfo.email;
    if (Object.keys(individual).length > 0) params.individual = individual;
    return stripe.accounts.create(params);
}
```

---

## Feature — Vault Modifications (Session 6)

**Spec:** "Vault Modifications — Engineering Specification" (6 sections)  
**iOS commits:** `8cfa8b8` (submodule) / `cafa8af` (parent, via submodule pointer update)  
**Backend commits:** `69d744d` (Vault.js boolean fix + all new routes) pushed to `origin main` and `appback main`  
**Droplet deploy:** `cd /var/www/nostia-backend && git pull origin main && pm2 restart nostia`

---

### Section 1 — @usernames Throughout Vault

Real names replaced with `@username` everywhere in the vault UI (expense cards, balance rows, split lists), except the chat tab which was out of scope.

**Backend (`models/Vault.js`):**
- `getSplits` query: added `u.username as userUsername` to the SELECT
- `getTripSummary` balance construction for split members: `username: split.userUsername` (was `split.userName`)
- Balance output mapped: now includes `username` field alongside existing `name`

**iOS (`Views/Vault/VaultView.swift`):** All name displays changed to show `@\(username)` using `paidByUsername` on `VaultEntry` and `userUsername` on `VaultSplit`.

---

### Section 2 — Restrict Expense Deletion

Only the vault leader or the expense creator (payer) can delete an expense.

**Backend (`server.js`, `DELETE /api/vault/:id`):**
```js
const isLeader = trip && trip.vaultLeaderId === req.user.id;
const isCreator = entry.paidBy === req.user.id;
if (!isLeader && !isCreator) return res.status(403)...
```

**iOS (`Views/Vault/VaultView.swift`, `ExpenseCard`):**
```swift
let canDelete = vaultLeaderId == me || entry.paidById == me
// Delete button hidden when !canDelete
```

---

### Section 3 — Restrict Cash/Card to Own Splits

Cash and Card payment buttons only appear on splits belonging to the current user.

**Backend (`server.js`):**
- `PUT /api/vault/splits/:splitId/paid` now checks `split.userId === req.user.id` (403 if not)
- `POST /api/vault/splits/:splitId/payment-intent` same ownership check

**iOS (`Views/Vault/VaultView.swift`, `ExpenseCard`):**
```swift
let isOwnSplit = split.userId == me
// Cash/Card buttons guarded by: isOwnSplit && !split.paid
```

---

### Section 4 — Pay Total (Bulk Stripe Payment)

Tapping own balance row opens a `PayTotalSheet` modal listing all outstanding splits, with a combined total and a single Card payment that creates one PaymentIntent for all.

**Backend (`server.js`, `POST /api/vault/bulk-payment-intent`):**
- Verifies all `splitIds` belong to `req.user.id`
- Sums all split amounts, applies `calculateChargedAmount` to total
- Creates one Stripe PaymentIntent with metadata `{ type: 'vault_bulk', splitIds: '1,2,3' }`
- Inserts one `vault_transactions` row per split
- Returns `clientSecret`, `chargedAmount`, `splitIds`, `customerId`, `ephemeralKeySecret`

**Backend (`services/stripeService.js`, webhook `payment_intent.succeeded`):**
```js
} else if (type === 'vault_bulk' && splitIds) {
  const ids = splitIds.split(',').map(id => parseInt(id, 10)).filter(n => Number.isInteger(n) && n > 0);
  for (const id of ids) {
    db.prepare(`UPDATE vault_splits SET paid = 1, paidViaStripe = 1, paidAt = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  }
  db.prepare(`UPDATE vault_transactions SET status = 'completed'... WHERE stripePaymentIntentId = ?`).run(pi.id);
}
```

**iOS:**
- `Models/VaultModels.swift`: new `BulkPaymentIntentResponse` struct with `splitIds: [Int]`
- `Network/API/VaultAPI.swift`: `createBulkPaymentIntent(splitIds:tripId:)` method
- `ViewModels/VaultViewModel.swift`: `handleBulkCardTap`, `prepareBulkPaymentSheet`, `handleBulkPaymentResult`, `markAllPaid`
- `Views/Vault/VaultView.swift`: own balance row is tappable (shows chevron); opens `PayTotalSheet` with unpaid split list, total, fee-inclusive amount, Cash + Card buttons

---

### Section 5 — Expense Reminder Notification

Vault leader or expense creator can tap another member's balance row → confirmation alert → in-app `vault_reminder` notification sent to that user.

**Backend (`server.js`, `POST /api/vault/remind`):**
- Checks sender is vault leader OR has an owed split from them to `targetUserId`
- Calculates outstanding balance for the body text
- Calls `NotificationService.saveNotification(targetUserId, 'vault_reminder', 'Payment Reminder', ...)`
- **In-app notification only** (no push notification per spec)

**iOS:**
- `Network/API/VaultAPI.swift`: `sendReminder(targetUserId:tripId:)` method
- `ViewModels/VaultViewModel.swift`: `sendReminder(targetUserId:tripId:)` method
- `Models/Notification.swift`: `vault_reminder` type → icon `"bell.badge"`, color `"EF4444"` (red)
- `Views/Vault/VaultView.swift`:
  - `canSendReminder(to:in:)` helper: sender must be leader OR have unpaid entries where `entry.paidById == me` and entry has unpaid split for targetId
  - Other-user balance row is tappable when `canSendReminder` is true → confirmation alert → `vm.sendReminder`

---

### Section 6 — Stripe Saved Card Fix

Two sub-fixes: (a) prompt to add card if no saved payment method, (b) wire saved customer ID + ephemeral key into `PaymentSheet.Configuration` so saved cards appear.

**Backend (`server.js`, `POST /api/vault/splits/:splitId/payment-intent`):**
```js
let customerId = null; let ephemeralKeySecret = null;
const userRecord = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.user.id);
if (userRecord?.stripe_customer_id) {
  customerId = userRecord.stripe_customer_id;
  const ek = await stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2024-04-10' });
  ephemeralKeySecret = ek.secret;
}
res.json({ clientSecret, chargedAmount, customerId, ephemeralKeySecret });
```

**iOS (`ViewModels/VaultViewModel.swift`):**
```swift
func handleCardTap(splitId: Int) async {
    let methods = (try? await PaymentsAPI.shared.getPaymentMethods()) ?? []
    if methods.isEmpty { pendingCardSplitId = splitId; showNoCardPrompt = true }
    else { await preparePaymentSheet(splitId: splitId) }
}
// preparePaymentSheet now wires CustomerConfiguration:
if let cid = res.customerId, let ek = res.ephemeralKeySecret {
    config.customer = PaymentSheet.CustomerConfiguration(id: cid, ephemeralKeySecret: ek)
}
```

`AddCardReturnView` sheet wraps `PaymentMethodsView` with a Done button that retries the payment.

---

### Production Crash — Boolean Decode Bug (Hotfix)

**Symptom:** After TestFlight build, entering any vault with an expense for the current user showed "Data error: The data couldn't be read because it isn't in the correct format" and a blank vault.

**Root cause:** `getUserUnpaidSplits` in `models/Vault.js` returned raw SQLite integers (`0`/`1`) for `paid`. The new `UnpaidSplit.paid: Bool` in Swift caused `JSONDecoder` to throw `typeMismatch`, failing the entire `VaultSummary` decode. `getSplits` already had `.map(s => ({ ...s, paid: s.paid === 1 }))` but `getUserUnpaidSplits` did not.

**Fix (`models/Vault.js`):**
```js
return stmt.all(tripId, userId).map(s => ({ ...s, paid: s.paid === 1 }));
```

Committed as `69d744d`, deployed to production.

---

### New iOS Model Structs

**`Models/VaultModels.swift`** additions:
```swift
struct UnpaidSplit: Codable, Identifiable {
    let id: Int; let vaultEntryId: Int; let userId: Int; let amount: Double
    let paid: Bool; let description: String; let date: String; let currency: String
    var formattedDate: String { /* ISO8601 → "MMM d, yyyy" */ }
}
struct BulkPaymentIntentResponse: Codable {
    let clientSecret: String; let chargedAmount: Double
    let customerId: String?; let ephemeralKeySecret: String?; let splitIds: [Int]
}
// VaultSummary gained: unpaidSplits: [UnpaidSplit]?
// VaultEntry gained: paidByUsername: String?
// VaultSplit gained: userUsername: String?
// VaultBalance gained: username: String?
// PaymentIntentResponse gained: customerId: String?, ephemeralKeySecret: String?
```

---

## Feature — DM Restriction (Session 5)

**Files:** `NOSTIA/NOSTIA/Views/Friends/FriendsView.swift`, `NOSTIA/NOSTIA/ViewModels/FriendsViewModel.swift`  
**Commits:** `613cdd8` (submodule) / `cafa8af` (parent)

Direct messaging is now restricted to mutual followers only, and the message button appears **only in the Followers tab**.

**Before:** Message button appeared in both the Followers tab (if you follow them back) and the Following tab (if they follow you back).  
**After:** Message button appears only in the Followers tab, and only when `vm.followingIds.contains(user.id)` — i.e., you are also following that follower (mutual follow). The Following tab shows only the unfollow button.

The `followerIds` computed property on `FriendsViewModel` was removed as it became dead code. `followingIds` is still used for the Followers tab mutual-follow guard.

---

## Performance UX — Skeleton Loaders, Caching, Optimistic Rendering (Session 4)

All changes from the Performance UX Engineering Specification. Commits: `f3df66d` (submodule) / `b7edf07` (parent).

### New File: `Network/CacheManager.swift`

Actor-based in-memory cache with 30-second TTL and stale-while-revalidate semantics.

```swift
actor CacheManager {
    static let shared = CacheManager()
    func get<T>(_ key: String) -> T?   // returns nil if expired
    func set(_ key: String, value: Any)
    func invalidate(_ key: String)
    func invalidatePrefix(_ prefix: String)
    func clearAll()
}
enum CacheKey {
    static let homeFeed, notifications, vaultList, followersList, followingList, eventList: String
    static func userPosts(_ id: Int) -> String
    static func vaultDetail(_ id: Int) -> String
    static func comments(_ postId: Int) -> String
}
```

**Note:** The project uses `PBXFileSystemSynchronizedRootGroup` — new `.swift` files placed in `NOSTIA/NOSTIA/` are automatically compiled by Xcode with no `.pbxproj` edits. If Xcode shows "Cannot find X in scope" for a newly-added file, do **Product → Clean Build Folder** after indexing finishes; it's a stale error from before the file was discovered.

### Shimmer + Skeleton Components (`Views/Components/SharedComponents.swift`)

Added at end of file (existing components untouched):

- **`ShimmerModifier`** — animates a `LinearGradient` from `UnitPoint(x: -1, y: 0.5)` to `(x: 1, y: 0.5)` via `.repeatForever(autoreverses: false)` for a continuous left-to-right sweep. Available as `.shimmer()` extension on `View`.
- **Primitives:** `SkeletonBar(width:height:)`, `SkeletonRect(width:height:cornerRadius:)`, `SkeletonCircle(size:)` — all `Color(uiColor: .systemGray5)` + `.shimmer()`
- **Composites:** `FeedPostCardSkeleton`, `FeedSkeletonView`, `ProfileSkeletonView`, `NotificationSkeletonView`, `FollowSkeletonView`, `SearchSkeletonView`, `VaultListSkeletonView`, `VaultDetailSkeletonView`, `VaultExpenseSkeletonView`, `EventListSkeletonView`, `CommentSkeletonView`

Skeletons show only when `isLoading && data.isEmpty`. Pull-to-refresh uses the standard iOS spinner (unchanged).

### Optimistic Rendering (`ViewModels/FeedViewModel.swift`)

`FeedPost` struct changed 5 fields from `let` to `var` in `Models/FeedModels.swift` to allow in-place mutation of `posts[idx]`.

**`toggleLike` / `toggleDislike`:** Double-tap guard using `@Published var likingPostIds: Set<Int>` and `dislikingPostIds: Set<Int>`. Pattern: snapshot post → mutate in-place (isLiked, likeCount, cross-clear dislike if needed) → fire API → restore snapshot on error (silent). No `loadFeed()` call.

**`submitComment`:** Removed `await loadFeed()` call; comment is appended to `comments` array locally; invalidates `CacheKey.comments(postId)` on success.

**`deletePost`:** Removes from `posts` array optimistically, reinserts at original index on API failure, invalidates `CacheKey.homeFeed` on success.

**`EventDetailSheet.rsvp(_:)`** (`Views/Friends/EventSheets.swift`): Optimistic RSVP — snapshots `myRsvp` + `goingCount`, updates immediately, sets `isRsvping = true` (disables buttons but shows no spinner), confirms with server or restores snapshot on failure. `ProgressView` removed from RSVP button labels.

**`PostCard`** (`Views/Feed/PostCard.swift`): Added `isLikeProcessing: Bool` and `isDislikeProcessing: Bool` params with `.disabled(isLikeProcessing || isDislikeProcessing)` on both buttons.

### Caching in ViewModels — Standard Pattern

```swift
func load() async {
    if let cached: [T] = await CacheManager.shared.get(CacheKey.xxx) {
        items = cached          // serve instantly, skip skeleton
    } else {
        isLoading = true        // show skeleton only on cache miss
    }
    let fresh = (try? await SomeAPI.shared.getAll()) ?? []
    if !fresh.isEmpty {
        items = fresh
        await CacheManager.shared.set(CacheKey.xxx, value: fresh)
    }
    isLoading = false
}
```

Applied to: `FeedViewModel.loadFeed()`, `FeedViewModel.loadUserPosts(userId:)`, `FeedViewModel.loadComments(for:)`, `NotificationsViewModel.load()`, `FriendsViewModel.loadAll()` (both follower/following keys), `TripsViewModel.loadTrips()`, `VaultViewModel.loadVault(tripId:)`, `EventsViewModel.loadAll()`.

Cache invalidation on write:
- `createPost()` → invalidates `homeFeed` + `userPosts(currentUserId)`
- `submitComment()` → invalidates `comments(postId)`
- `follow()` / `unfollow()` → invalidates `followersList`, `followingList`, `homeFeed`
- `createTrip()` / `deleteTrip()` → invalidates `vaultList`
- `addExpense()` / `deleteEntry()` / `markPaid()` → invalidates `vaultDetail(tripId)`
- Event creation → invalidates `eventList`

**Logout cache clear:** `AuthManager.logout()` calls `Task { await CacheManager.shared.clearAll() }` before `deleteToken()`.

---

## Bug Fixes — Session 3

Four visual/rendering bugs fixed and pushed as commit `4aa7bfc` (submodule) / `b6a1852` (parent).

### 1. Home Banner Shows "O" Instead of Profile Photo

**File:** `NOSTIA/NOSTIA/Views/Components/SharedComponents.swift`

**Root cause:** Profile pictures are stored as **raw base64** (no `data:` prefix) in SQLite. `ProfilePictureView` only handled `data:image/...;base64,...` strings and `https://` URLs. `URL(string:)` accepts almost any string, so the raw base64 was being silently passed to `AsyncImage` which then failed, falling through to `AvatarView` showing the initial letter. (`UserAvatarView` in the toolbar worked because it called `Data(base64Encoded:)` directly with no prefix check.)

**Fix:** Added a second decode branch after the `data:image` check and before the URL branch:

```swift
} else if let data = Data(base64Encoded: s, options: .ignoreUnknownCharacters),
          let img = UIImage(data: data) {
    Image(uiImage: img).resizable().scaledToFill()
} else if s.hasPrefix("http"), let url = URL(string: s) {
    // AsyncImage branch
```

Also changed the URL guard from `URL(string:)` to `s.hasPrefix("http")` to prevent base64 matching as a URL, and added `.ignoreUnknownCharacters` to the `data:image` branch too.

### 2. Event Flyer Image Not Appearing on Map Pin

**File:** `NOSTIA/NOSTIA/Views/Friends/FriendsMapView.swift`  
**Also:** `NOSTIA/NOSTIA/Views/Friends/EventSheets.swift`

**Root cause:** `Data(base64Encoded:)` without `.ignoreUnknownCharacters` fails silently when the base64 string contains newline characters, which JPEG-compressed output from iOS commonly includes. The decoder returned `nil`, so the pin fell back to the default orange calendar circle.

**Fix:** Added `.ignoreUnknownCharacters` option to all `Data(base64Encoded:)` calls in `decodeFlyer()` (FriendsMapView), `EventDetailSheet`, and `EventFlyerView` (EventSheets).

### 3. Home Background Expands Scroll Layout

**File:** `NOSTIA/NOSTIA/Views/Home/HomeView.swift`

**Root cause:** The background `Image` was a child of a `ZStack`. ZStack children participate in layout — the ZStack expanded to the height of the tallest child (the full scroll content), the background Image filled that expanded frame, and everything was pushed out of position.

**Fix:** Removed the ZStack wrapper entirely. `ScrollView` is now the direct top-level view. The background is applied via `.background {}` modifier on the `ScrollView`:

```swift
ScrollView { ... }
    .background {
        if let bgImage = backgroundImage {
            Image(uiImage: bgImage)
                .resizable()
                .scaledToFill()
                .ignoresSafeArea()
        }
    }
```

Background-modifier content draws at the view's own bounds and never participates in layout sizing.

---

## Bug Fixes — Session 2

### 4. DM Button Opens Unfollow Dialog Instead of Chat

**File:** `NOSTIA/NOSTIA/Views/Friends/FriendsView.swift`

**Root cause:** Chat navigation used `@State private var chatTarget: (conversationId: Int, name: String, friendId: Int)?` — a tuple. Computed `Binding<ChatDestination?>` derived from a tuple state is not reliably observed by SwiftUI's `navigationDestination(item:)`. Navigation never fired; tapping again hit the nearby unfollow button.

**Fix:** Replaced with a dedicated `Identifiable` struct and direct binding:

```swift
struct ChatDestination: Identifiable { let id: Int; let name: String; let friendId: Int }
@State private var chatDestination: ChatDestination?
// ...
.navigationDestination(item: $chatDestination) { dest in
    ChatView(conversationId: dest.id, friendName: dest.name)
}
```

### 5. Profile Picture Not Refreshing in Home Banner After Save

**File:** `NOSTIA/NOSTIA/Views/Profile/ProfileView.swift` + `HomeView.swift`

**Root cause:** `ProfileView` is pushed via `NavigationLink` — SwiftUI doesn't re-init the parent `HomeView` on pop. `HomeViewModel.loadAll()` was only called on tab switch.

**Fix:** Posted a `NotificationCenter` notification from `ProfileView.saveProfile()`:
```swift
NotificationCenter.default.post(name: .profileUpdated, object: nil)
extension Notification.Name {
    static let profileUpdated = Notification.Name("com.nostia.profileUpdated")
}
```
`HomeView` listens and reloads:
```swift
.onReceive(NotificationCenter.default.publisher(for: .profileUpdated)) { _ in
    Task { await vm.loadAll() }
}
```

### 6. Map Events — Viewport-Based Loading

**Files:** `NOSTIA/NOSTIA/Network/API/AdventuresAPI.swift`, `NOSTIA/NOSTIA/Views/Friends/FriendsMapView.swift`

Added viewport-based event loading using the existing backend `/api/events/map` endpoint (which implements the radius formula `R(t) = 20 + 3t + H(t-50) * 10t`).

`AdventuresAPI.getMapEvents()`:
```swift
func getMapEvents(minLat: Double, maxLat: Double, minLng: Double, maxLng: Double,
                  viewportRadiusMiles: Double = 20) async throws -> [Event]
```

`FriendsMapView` uses `MapCameraPosition.userLocation(followsHeading:fallback:)` and fires `loadEventsForRegion()` on `.onMapCameraChange(frequency: .onEnd)`:
```swift
let viewportRadiusMiles = half.latitudeDelta / 2 * 69.0  // degrees → miles
```

---

## Features Implemented — Session 1

All 5 features from the Mixed Features Engineering Specification were applied to the correct `NOSTIA/NOSTIA/` directory.

---

### 1. Profile Image Crop (`ProfileCropView`)

**File:** `NOSTIA/NOSTIA/Views/Profile/ProfileView.swift`

Added `ProfileCropView` — a full-screen circular crop UI that sits between photo selection and upload.

**How it works:**
- User taps the camera icon in edit mode → `PhotosPicker` opens
- `onChange(of: selectedPhoto)` loads the raw `UIImage`, sets `imageToCrop`, shows `.fullScreenCover` with `ProfileCropView`
- `ProfileCropView` displays the image with `DragGesture` (pan) and `MagnificationGesture` (pinch-to-zoom), both clamped so the image always covers the circle
- A `blendMode(.destinationOut)` + `.compositingGroup()` overlay creates the circular cutout effect
- On "Use Photo": `renderCrop()` uses `UIGraphicsImageRenderer` + `UIBezierPath(ovalIn:)` clip to produce a clean circular `UIImage`
- The cropped image is JPEG-compressed at 0.75 quality and base64-encoded into `editImageData` for upload

**Key state:**
```swift
@State private var imageToCrop: UIImage?
@State private var showCrop = false
```

---

### 2. Profile Picture in Home Header (replaced logout button)

**File:** `NOSTIA/NOSTIA/Views/Home/HomeView.swift`

Replaced the logout icon button in the welcome header card with a circular `ProfilePictureView` wrapped in a `NavigationLink` that pushes `ProfileView`.

**Before:** `Button { showLogoutAlert = true }` with a logout icon  
**After:** `NavigationLink { ProfileView() } label: { ProfilePictureView(..., size: 44) }`

The gradient opacity was also reduced slightly (`0.85`) so a custom background shows through if set.

Note: `HomeView` takes `@Binding var selectedTab: Int` — this binding is used by the stat cards to navigate to other tabs and must be preserved in all future edits.

---

### 3. Home Screen Custom Background

**File:** `NOSTIA/NOSTIA/Views/Home/HomeView.swift`

Users can set a custom photo as the home screen background. It persists between launches via the app's `Documents` directory.

**How it works:**
- Double-tap anywhere on the scroll view background → `confirmationDialog` appears
- "Choose Photo" → `PhotosPicker` → image saved to `Documents/home_background.jpg`
- "Remove Background" (shown only if a background exists) → deletes the file, clears state
- On app launch: `loadBackgroundFromDisk()` restores the saved image

**Implementation detail:** The background `Image` is applied via `.background {}` modifier on the `ScrollView` (not a ZStack sibling — that caused layout expansion bugs). The `.onTapGesture(count: 2)` is attached to the `ScrollView` — interactive elements (buttons, cards) consume taps before they bubble up, so the gesture only fires on empty background areas.

**Persistence helpers:**
```swift
private var backgroundImageURL: URL? { 
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
        .appendingPathComponent("home_background.jpg")
}
```

---

### 4. Event Flier as Map Pin (`EventMapPin`)

**File:** `NOSTIA/NOSTIA/Views/Friends/FriendsMapView.swift`

When an event has a `flyerImage`, the map pin displays that image cropped to a circle with a colored border instead of the generic calendar icon.

**EventMapPin logic:**
1. If `event.flyerImage` is a `data:image` base64 string → decode inline to `UIImage`
2. If it's a remote URL → `AsyncImage` with fallback
3. Otherwise → default colored circle with calendar SF Symbol

**Border color by event visibility:**

| Visibility | Color |
|-----------|-------|
| `"public"` | `nostiaAccent` (blue) |
| `"friends"` | `nostriaPurple` |
| `"private"` | `nostriaDanger` (red) |

The `flyerImage` column exists on the server as `flyerImage TEXT` (camelCase) in the `events` table, so no `CodingKeys` mapping is needed — Swift's synthesized decoder matches it directly to `var flyerImage: String?` on `Event`.

---

### 5. Notification Tab Empty List Bug Fix

**File:** `NOSTIA/NOSTIA/Models/Notification.swift`

**Root cause:** SQLite stores booleans as integers (`0` / `1`). The Node.js API returns `read: 0` or `read: 1` as JSON numbers. Swift's default `JSONDecoder` throws `typeMismatch` when it encounters a JSON integer for a `Bool` property, causing the entire array decode to fail silently and leaving the notifications list empty — even though the badge count (a separate API call returning `unreadCount: Int`) worked fine.

**Fix:** Custom `init(from:)` on `NostiaNotification` that tries `Bool` first, then `Int`, then defaults to `false`:

```swift
if let b = try? c.decode(Bool.self, forKey: .read) {
    read = b
} else if let i = try? c.decode(Int.self, forKey: .read) {
    read = i != 0
} else {
    read = false
}
```

The struct was changed from `Codable` to `Identifiable, Decodable` since it is never encoded (only decoded from API responses). This also required changing `NotificationsResponse: Codable` → `NotificationsResponse: Decodable` to fix a subsequent build error.

---

### `ProfilePictureView` Component

**File:** `NOSTIA/NOSTIA/Views/Components/SharedComponents.swift`

Added a reusable `ProfilePictureView` that handles all three profile picture storage formats:

```swift
struct ProfilePictureView: View {
    let urlString: String?  // nil, base64 data URL, or remote https URL
    let initial: String     // fallback initial letter
    let size: CGFloat
}
```

| Input | Rendered as |
|-------|-------------|
| `nil` or empty | `AvatarView` with initial letter |
| `data:image/...;base64,...` | Decoded inline `UIImage` (with `.ignoreUnknownCharacters`) |
| Raw base64 (no prefix) | Decoded inline `UIImage` (with `.ignoreUnknownCharacters`) |
| `https://...` | `AsyncImage` with loading/error fallback to `AvatarView` |

Used in both `HomeView` (44pt, header) and `ProfileView` (100pt, profile card). Profile pictures are stored as **raw base64** (no `data:` prefix) in the `profile_picture_url` TEXT column in SQLite — there is no separate image CDN. The `data:image` branch exists for forward compatibility.

---

## Build Error Fixed

**Error:** `Type 'NotificationsResponse' does not conform to protocol 'Encodable'`

When `NostiaNotification` was changed to `Decodable`-only (custom init), `NotificationsResponse: Codable` could no longer synthesize `Encodable` conformance because it contains `[NostiaNotification]?`.

**Fix:** `NotificationsResponse: Codable` → `NotificationsResponse: Decodable`

---

## Files Modified (NOSTIA/NOSTIA/)

| File | Change |
|------|--------|
| `Models/Notification.swift` | Custom `init(from:)` for `read` int/bool; `NotificationsResponse` → `Decodable`; added `vault_reminder` icon + color |
| `Models/FeedModels.swift` | 5 `FeedPost` fields changed `let` → `var`: `likeCount`, `dislikeCount`, `commentCount`, `isLiked`, `isDisliked` |
| `Network/CacheManager.swift` | **New file.** Actor-based in-memory cache with 30s TTL + `CacheKey` enum |
| `Network/API/AdventuresAPI.swift` | Added `getMapEvents(minLat:maxLat:minLng:maxLng:viewportRadiusMiles:)` |
| `Auth/AuthManager.swift` | `logout()` clears cache before deleting token |
| `ViewModels/FeedViewModel.swift` | Optimistic like/dislike/delete; cache integration; `likingPostIds`/`dislikingPostIds` double-tap guard; removed `loadFeed()` after comment |
| `ViewModels/NotificationsViewModel.swift` | Cache integration |
| `ViewModels/FriendsViewModel.swift` | Cache integration; invalidate on follow/unfollow; removed `followerIds` (dead code after DM restriction) |
| `ViewModels/TripsViewModel.swift` | Cache integration; invalidate on create/delete |
| `ViewModels/VaultViewModel.swift` | Cache integration; invalidate on add/delete/markPaid; `handleCardTap`, `handleBulkCardTap`, `preparePaymentSheet` (with CustomerConfiguration), `prepareBulkPaymentSheet`, `markAllPaid`, `sendReminder`; `showNoCardPrompt`, `bulkPaymentSheet` published state |
| `Views/Components/SharedComponents.swift` | Added `ProfilePictureView`; raw base64 branch; `.ignoreUnknownCharacters`; shimmer modifier + 11 skeleton composites |
| `Views/Feed/FeedView.swift` | `FeedSkeletonView()` replaces spinner; passes processing flags to `PostCard` |
| `Views/Feed/PostCard.swift` | `isLikeProcessing` / `isDislikeProcessing` params + `.disabled()` |
| `Views/Feed/CommentsSheet.swift` | `CommentSkeletonView()` replaces spinner |
| `Views/Profile/ProfileView.swift` | Added `ProfileCropView`; wired crop; posts `profileUpdated`; `ProfileSkeletonView()` |
| `Views/Profile/PublicProfileView.swift` | `ProfileSkeletonView()` replaces spinner |
| `Views/Notifications/NotificationsView.swift` | `NotificationSkeletonView()` replaces spinner |
| `Views/Friends/FriendsView.swift` | DM button fix (ChatDestination struct); message button removed from Following tab (mutual-follow DM restriction) |
| `Views/Friends/FriendsMapView.swift` | `EventMapPin` + `decodeFlyer()`; viewport-based loading; `.ignoreUnknownCharacters` |
| `Views/Friends/EventSheets.swift` | `.ignoreUnknownCharacters` on flyer decode; optimistic RSVP (no spinner) |
| `Views/Trips/TripsView.swift` | `VaultListSkeletonView()` replaces spinner |
| `Views/Vault/VaultDetailView.swift` | `VaultDetailSkeletonView()` replaces spinner |
| `Views/Vault/VaultView.swift` | **Complete rewrite (Session 6):** `@username` display; own-balance-row Pay Total sheet; other-user-row reminder alert; `canSendReminder` helper; `ExpenseCard` delete/pay guards; `PayTotalSheet` modal; `AddCardReturnView`; no-card prompt. Also: `VaultExpenseSkeletonView()` replaces spinner (Session 4). |
| `Models/VaultModels.swift` | New `UnpaidSplit`, `BulkPaymentIntentResponse` structs; `username`/`paidByUsername`/`userUsername` fields; `customerId`/`ephemeralKeySecret` on `PaymentIntentResponse` |
| `Network/API/VaultAPI.swift` | Added `createBulkPaymentIntent(splitIds:tripId:)` and `sendReminder(targetUserId:tripId:)` |
| `Views/Events/EventsView.swift` | `EventListSkeletonView()` replaces spinner; cache in `EventsViewModel`; **Session 7:** `isCoverPhotoLoading` race fix; `followers` visibility option; size validation; **Session 9:** `goingEvents`; concurrent `loadAll()`; `otherEvents` filter; sectioned list; `CreateEventFromDiscoverSheet` locationManager camera fix |
| `Views/Friends/EventSheets.swift` | `.ignoreUnknownCharacters` on flyer decode; optimistic RSVP; **Session 7:** `flyerError` state; `do/catch` in `uploadFlyer()`; `followers` label fix; **Session 9:** `Color.clear` overlay pattern for header image and `EventFlyerView` |
| `Views/Friends/FriendsMapView.swift` | `EventMapPin` + `decodeFlyer()`; viewport-based loading; `.ignoreUnknownCharacters`; **Session 7:** `followers` visibility; `EventMapPin` handles both `"friends"` and `"followers"`; **Session 9:** `locationManager` env object; `.task` sets camera from known location |
| `Views/Home/HomeView.swift` | Background image feature; logout → ProfilePictureView nav link; profileUpdated observer; background moved to `.background {}` modifier; **Session 7:** `scenePhase` handler; `startPeriodicSync()`; ProfilePictureView size 44→88; **Session 9:** `HomeSheet` enum; single consolidated sheet; tappable event cards; "Nearby Events" + "Events You're Going To" sections |
| `Views/Feed/PostCard.swift` | `isLikeProcessing` / `isDislikeProcessing` params + `.disabled()`; **Session 9:** `Color.clear` overlay pattern for post image |
| `Extensions/UIImage+Resize.swift` | **Session 9:** Fixed pixel-space calculation; `format.scale = 1.0` — output is exactly `maxDimension` pixels regardless of device screen scale |
| `Location/LocationManager.swift` | *(new in Session 7)* `periodicTimer`, `syncInterval`, `startPeriodicSync()`, `stopPeriodicSync()`, `requestLocationIfAuthorized()` |

---

## Important Ongoing Notes

- **`NostiaApp/` is not compiled.** Do not edit it. It is a leftover folder with no Xcode target reference.
- **The iOS submodule is double-nested:** `nostia-ios/` (parent folder) → `nostia-ios/` (submodule root). The submodule's own git history is on branch `master`; the parent repo is on `main`.
- **Always push the submodule first**, then update the parent repo's submodule pointer. Pushing parent first would point to a commit that doesn't exist on the remote yet.
- **Profile pictures are raw base64 in SQLite** (no `data:` prefix), not a CDN. `ProfilePictureView` handles this via a direct `Data(base64Encoded:, options: .ignoreUnknownCharacters)` branch. Large images should be resized before encoding (currently 400×400 max after crop in ProfileView).
- **Event flyer images are also raw base64** stored in `events.flyerImage TEXT`. Always use `.ignoreUnknownCharacters` when decoding — JPEG base64 output from iOS can contain embedded newlines that cause strict decoding to fail.
- **`navigationDestination(item:)` requires a direct `@State` binding** to an `Identifiable` type. Do not derive a binding from a tuple state variable — SwiftUI won't reliably observe it and navigation will silently fail.
- **The `User` struct** (`Models/User.swift`) has a `CodingKeys` enum because the server returns `profile_picture_url` (snake_case) while Swift uses `profilePictureUrl` (camelCase). Any new snake_case fields from the server need a `CodingKeys` entry.
- **`HomeView` signature** is `HomeView(selectedTab: Binding<Int>)` — the binding is used by `StatCard` tap targets to switch tabs. Do not remove it.
- **Production server** runs on DigitalOcean at `142.93.116.6`, pulls from `appback` remote via PM2 process `nostia`. Server-side deploys require SSH + `git pull` + `pm2 restart nostia`. iOS-only changes (no server change) do not require a server deploy.
- **`PBXFileSystemSynchronizedRootGroup`** is used for the NOSTIA target — any `.swift` file placed in `NOSTIA/NOSTIA/` is automatically compiled without editing `.pbxproj`. If Xcode shows "Cannot find X in scope" for a newly-added file (e.g., after a `git pull` on the Mac), do **Product → Clean Build Folder** once indexing finishes. The error is stale, not a missing file reference.
- **DM is mutual-follow only.** The message button appears only in the Followers tab (`FriendsView`) and only when `followingIds.contains(user.id)`. It does not appear in the Following tab or on public profiles. The server-side also enforces this — `ChatViewModel.send()` handles "read-only"/"locked"/"mutually follow" error responses by setting `isLocked = true`.
- **In-memory cache is cleared on logout** (`CacheManager.clearAll()` in `AuthManager.logout()`). Cache TTL is 30 seconds. Skeleton loaders only show on cache miss (first load or after cache expiry). Pull-to-refresh always fetches fresh data but shows the OS spinner, not the skeleton.
- **Vault boolean mapping:** SQLite stores `paid` as `0`/`1` integers. Every query method in `models/Vault.js` that returns split rows **must** map the result with `.map(s => ({ ...s, paid: s.paid === 1 }))`. Both `getSplits` and `getUserUnpaidSplits` now do this. Missing this causes Swift's `JSONDecoder` to throw `typeMismatch` and blank the entire vault.
- **Vault delete/pay permissions are double-enforced:** Server returns 403 for unauthorized deletes (non-leader/non-creator) and unauthorized mark-paid/payment-intent calls (non-owner). Client also hides the UI elements. Both layers required by spec.
- **Vault reminder is in-app only.** `POST /api/vault/remind` calls `NotificationService.saveNotification` — no Expo push token is sent. The `vault_reminder` type shows icon `bell.badge` (red) in `Notification.swift`.
- **Bulk PaymentIntent metadata:** `{ type: 'vault_bulk', splitIds: '1,2,3' }` (comma-joined string). Webhook handler parses by splitting on comma and parsing each int. `vault_transactions` gets one row per split, all linked to the same `stripePaymentIntentId`.
- **Optimistic rendering guard:** `likingPostIds` and `dislikingPostIds` (`Set<Int>` on `FeedViewModel`) prevent double-taps. `PostCard` accepts `isLikeProcessing` and `isDislikeProcessing` bool params and disables both reaction buttons while either is true.
- **Event visibility `'friends'` vs `'followers'`:** New events are created with `'followers'`; legacy data may have `'friends'`. All visibility checks in `models/Event.js` use `IN ('friends', 'followers')` to handle both. iOS UI shows only `"followers"` as an option but the `EventMapPin` and `EventCard` still handle `"friends"` for display.
- **Event access control:** `Event.findById()` now calls `canViewEvent()` and returns `null` for unauthorized access. The `follows` table (not `friends`) is authoritative for follower-visibility checks.
- **Location sync is periodic, not one-shot.** `LocationManager.startPeriodicSync()` fires immediately then every 10 minutes. Call it from `HomeView.task` and restart it on `scenePhase == .active`. Stop it on `.background` via `stopPeriodicSync()`.
- **`UIGraphicsImageRenderer` renders at device screen scale (3× on iPhone 14 Pro) by default.** Always set `format.scale = 1.0` and measure in actual pixels (`size.width * scale`) when producing images for upload. Failing to do this produces images 9× larger than expected, causing 413 errors.
- **Never use two `.sheet(item:)` or `.sheet(isPresented:)` on the same SwiftUI view.** Only the last modifier is processed; earlier ones are silently ignored. Consolidate multiple presentation triggers into a single `Identifiable` enum and one `.sheet(item:)` modifier.
- **SwiftUI image overflow fix:** `.scaledToFill()` + `.frame(maxWidth: .infinity)` does not establish hard layout bounds. Use `Color.clear.frame(...).overlay(Image(...).resizable().scaledToFill()).clipped()` — the transparent container establishes the frame, the image fills it, and `.clipped()` crops rendering to that frame.
- **Stripe Connect account type is `standard`.** `createConnectAccount()` uses `type: 'standard'` with `business_type: 'individual'` and pre-fills first name, last name, email from the user record. Old `'express'` accounts created before this change are unaffected.
- **Stripe `standard` accounts ignore `business_type` in hosted onboarding UI.** Setting `business_type: 'individual'` on the account object does not force Stripe's hosted page to skip the business-type selector — it still defaults to business-first. The individual name/email pre-fill is the best mitigation without switching account types. If the business flow must be eliminated entirely, switch to `type: 'express'` (requires enabling Express in Stripe Dashboard → Connect → Settings). Express accounts honour `business_type` during onboarding; the trade-off is users get the limited Stripe Express dashboard instead of a full Stripe account.
- **To reset a test user's Stripe Connect state:** `UPDATE users SET stripe_account_id = NULL, onboarding_complete = 0 WHERE username = 'x';` — `getOrCreateConnectAccount` skips creation if `stripe_account_id` is already set, so clearing it is required to re-test the onboarding flow.
