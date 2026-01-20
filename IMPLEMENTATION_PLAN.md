# Nostia UI Improvements & Stripe Integration - Implementation Plan

## Overview
This plan implements all UI modifications and Stripe payment integration from the PDF requirements, targeting both web and mobile platforms with MVP-level polish.

---

## Phase 1: Dependencies & Environment Setup

### Backend Dependencies
```bash
cd c:\nostia-app
npm install stripe@^14.8.0 express-validator@^7.0.1
```

### Web Client Dependencies
```bash
cd client
npm install react-hot-toast@^2.4.1 framer-motion@^11.0.3 @stripe/stripe-js@^2.4.0 @stripe/react-stripe-js@^2.4.0
```

### Mobile Dependencies
```bash
cd nostia-mobile
npm install expo-haptics@~13.0.1 react-native-toast-message@^2.2.0 @stripe/stripe-react-native@^0.37.0
```

### Environment Variables

**Root `.env` file:**
```env
# Existing
PORT=3000
JWT_SECRET=nostia-secret-key-change-in-production
DEEPSEEK_URL=http://localhost:11434/api/generate
DEEPSEEK_MODEL=deepseek-r1:1.5b

# New Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_...your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret
STRIPE_API_VERSION=2024-11-20.acacia
```

**`client/.env`:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...your_stripe_publishable_key
VITE_API_URL=http://localhost:3000/api
```

**`nostia-mobile/.env`:**
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your_stripe_publishable_key
```

---

## Phase 2: Database Schema Changes

### New Tables (Add to `database/db.js`)

1. **stripe_customers** - Maps Nostia users to Stripe customer IDs
2. **payment_methods** - Stores user payment methods (cards, etc.)
3. **vault_transactions** - Tracks all Stripe payments for vault splits

### Modified Tables

Add to **vault_splits**:
- `stripePayable` (BOOLEAN) - Whether split can be paid via Stripe
- `paidViaStripe` (BOOLEAN) - Whether split was paid through Stripe
- `paidAt` (DATETIME) - Timestamp of payment completion

---

## Phase 3: Backend Stripe Integration

### New Files

1. **`services/stripeService.js`** - Core Stripe logic
   - Customer creation/retrieval
   - Payment intent creation
   - Payment confirmation
   - Transaction history
   - Webhook handling

2. **`models/Payment.js`** - Payment method management
   - Add/remove payment methods
   - Set default payment method
   - Get user payment methods

### Updated Files

1. **`server.js`** - Add payment routes:
   - `POST /api/payments/create-intent` - Create Stripe payment intent
   - `POST /api/payments/confirm` - Confirm successful payment
   - `GET /api/payments/trip/:tripId/history` - Get transaction history
   - `POST /api/webhooks/stripe` - Stripe webhook endpoint
   - `GET /api/payment-methods` - Get user payment methods
   - `PUT /api/payment-methods/:id/default` - Set default payment method

2. **`models/Vault.js`** - Add method:
   - `getUserUnpaidSplits(userId)` - Get all unpaid splits for payment

---

## Phase 4: Web UI Improvements

### New Utility Files

1. **`client/src/utils/animations.js`** - Framer Motion animation variants
   - Button press animations (scale to 0.96)
   - Ripple effects
   - Slide/fade transitions
   - Skeleton pulse animations

### New Components

1. **`client/src/components/Toast.jsx`** - Toast notification provider using react-hot-toast
2. **`client/src/components/Button.jsx`** - Animated button with press feedback
3. **`client/src/components/SkeletonLoader.jsx`** - Loading skeletons for cards/text
4. **`client/src/components/EmptyState.jsx`** - Empty state with icons and actions
5. **`client/src/components/PaymentMethodCard.jsx`** - Payment method display/management
6. **`client/src/components/PaymentModal.jsx`** - Stripe payment flow modal

### Updated Files

1. **`client/src/App.jsx`**
   - Add ToastProvider
   - Wrap buttons with framer-motion for press animations
   - Update Home Status toggle with smooth color transition
   - Replace loading text with ActivityIndicator/skeleton loaders
   - Add empty states for trips, events, feed
   - Add shadows to cards
   - Increase text contrast

2. **`client/src/api.js`**
   - Add `paymentsAPI` with Stripe endpoints

---

## Phase 5: Mobile UI Improvements

### New Utility Files

1. **`nostia-mobile/src/utils/haptics.ts`** - Haptic feedback wrapper
   - Light/medium/heavy impacts
   - Success/warning/error notifications
   - Selection feedback

### New Components

1. **`nostia-mobile/src/components/Toast.tsx`** - Toast config for react-native-toast-message
2. **`nostia-mobile/src/components/AnimatedButton.tsx`** - Button with scale animation + haptics
3. **`nostia-mobile/src/components/SkeletonLoader.tsx`** - Animated skeleton cards
4. **`nostia-mobile/src/screens/PaymentScreen.tsx`** - Stripe payment sheet integration

### Updated Files

1. **`nostia-mobile/App.tsx`**
   - Add Toast component at root
   - Import Stripe provider
   - Add PaymentScreen to navigation stack

2. **`nostia-mobile/src/navigation/MainNavigator.tsx`**
   - Add scale animation to active tab icons
   - Smooth opacity transitions

3. **`nostia-mobile/src/screens/HomeScreen.tsx`**
   - Replace TouchableOpacity with AnimatedButton for primary actions
   - Add haptic feedback to Home Status toggle
   - Show toast on status change
   - Add haptic feedback to logout

4. **`nostia-mobile/src/screens/TripsScreen.tsx`**
   - Add haptic feedback to FAB button
   - Add haptic feedback to card presses
   - Replace loading with skeleton loader
   - Add press animation to trip cards

5. **`nostia-mobile/src/screens/FriendsScreen.tsx`**
   - Add haptic feedback to request accept/reject
   - Add haptic feedback to search
   - Show toast on friend request actions
   - Add press animations to friend cards

6. **`nostia-mobile/src/screens/AdventuresScreen.tsx`**
   - Add haptic feedback to category selection
   - Add haptic feedback to tab switching
   - Add press animations to adventure cards

7. **`nostia-mobile/src/screens/VaultScreen.tsx`**
   - Add "Pay with Stripe" button for unpaid splits
   - Add haptic feedback on mark paid
   - Show toast on payment success
   - Add press animations to expense cards
   - Link to PaymentScreen for Stripe payments

8. **`nostia-mobile/src/components/CreateTripModal.tsx`**
   - Add haptic feedback on create
   - Add haptic feedback on AI generate
   - Show toast on success

9. **`nostia-mobile/src/components/CreateExpenseModal.tsx`**
   - Add haptic feedback on create
   - Add haptic feedback on category selection
   - Show toast on success

10. **`nostia-mobile/src/services/api.ts`**
    - Add `paymentsAPI` with Stripe endpoints

---

## Phase 6: UI Enhancements Summary

### All Buttons (Web & Mobile)
- ✅ Subtle press animation (scale to 0.96, 100-150ms)
- ✅ Haptic feedback on mobile
- ✅ Visual state changes

### Primary Actions
- ✅ Ripple/glow feedback (Create Trip, Open Home, View Vault)
- ✅ Haptic feedback (mobile)
- ✅ Toast notifications on success

### Loading States
- ✅ Skeleton loaders for feeds, trips, events
- ✅ Spinner animations
- ✅ Disabled state during loading

### Home Status Toggle
- ✅ Smooth color transition
- ✅ Icon animation
- ✅ Haptic feedback (mobile)

### Empty States
- ✅ Icons with messages
- ✅ Actionable buttons
- ✅ Fade-in animation

### Cards
- ✅ Standardized border-radius (12px)
- ✅ Soft shadows for depth
- ✅ Increased contrast (title vs secondary text)
- ✅ Press animations

### Bottom Navigation (Mobile)
- ✅ Scale animation on active tab
- ✅ Icon switching (filled/outline)
- ✅ Smooth color transitions

### Toasts/Snackbars
- ✅ Success confirmations
- ✅ Error messages
- ✅ Dark theme styling

### Spacing
- ✅ Improved vertical spacing between sections
- ✅ Consistent padding/margins

---

## Phase 7: Stripe Payment Flow

### Backend Flow
1. User initiates payment for vault split
2. Backend creates Stripe customer (if not exists)
3. Backend creates payment intent
4. Returns client secret to frontend
5. Frontend collects payment method via Stripe Elements/PaymentSheet
6. Stripe processes payment
7. Webhook confirms payment
8. Backend marks vault split as paid
9. Backend records transaction in vault_transactions

### Web Flow
1. User clicks "Pay with Stripe" on vault split
2. PaymentModal opens with amount and recipient
3. User enters payment details via Stripe Elements
4. Payment processes
5. Toast shows success/error
6. Modal closes
7. Vault refreshes with updated balances

### Mobile Flow
1. User clicks "Pay with Stripe" on vault split
2. Navigate to PaymentScreen
3. Stripe PaymentSheet opens
4. User selects/enters payment method
5. Payment processes
6. Haptic feedback + toast on success
7. Navigate back to vault
8. Vault refreshes with updated balances

---

## Phase 8: Testing Strategy

### Backend Testing
- [ ] Stripe customer creation
- [ ] Payment intent creation
- [ ] Payment confirmation
- [ ] Webhook processing
- [ ] Vault balance updates
- [ ] Transaction history retrieval
- [ ] Error handling

### Web Testing
- [ ] Button animations (hover + press)
- [ ] Toast notifications
- [ ] Skeleton loaders
- [ ] Home Status toggle animation
- [ ] Empty states
- [ ] Payment modal flow
- [ ] Stripe Elements integration
- [ ] Transaction history display

### Mobile Testing
- [ ] Haptic feedback on all primary actions
- [ ] Button press animations
- [ ] Tab navigation animations
- [ ] Toast notifications
- [ ] Skeleton loaders
- [ ] Home Status toggle
- [ ] Stripe PaymentSheet
- [ ] Transaction history
- [ ] Navigation flow

### Stripe Testing (Use Test Cards)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

---

## Phase 9: Deployment Checklist

### Environment Setup
- [ ] Create Stripe account
- [ ] Get production API keys
- [ ] Set up webhook endpoint
- [ ] Configure environment variables
- [ ] Test webhook with Stripe CLI

### Database
- [ ] Run migration script
- [ ] Verify new tables created
- [ ] Back up existing data

### Dependencies
- [ ] Install all backend dependencies
- [ ] Install all web dependencies
- [ ] Install all mobile dependencies
- [ ] Verify no version conflicts

### Documentation
- [ ] Update README with Stripe setup
- [ ] Document payment flow
- [ ] Add troubleshooting guide
- [ ] Update API documentation

---

## Implementation Order (Recommended)

1. **Phase 1** - Install dependencies & setup environment
2. **Phase 2** - Database schema changes
3. **Phase 3** - Backend Stripe integration + routes
4. **Phase 4** - Web UI utilities + components
5. **Phase 5** - Mobile UI utilities + components
6. **Phase 6** - Apply UI enhancements across screens
7. **Phase 7** - Integrate Stripe payment flows
8. **Phase 8** - Testing
9. **Phase 9** - Documentation + deployment

---

## Critical Files Summary

### Must Create (18 files)
1. `services/stripeService.js` - Core Stripe logic
2. `models/Payment.js` - Payment method management
3. `client/src/utils/animations.js` - Animation variants
4. `client/src/components/Toast.jsx` - Toast provider
5. `client/src/components/Button.jsx` - Animated button
6. `client/src/components/SkeletonLoader.jsx` - Loading skeletons
7. `client/src/components/EmptyState.jsx` - Empty states
8. `client/src/components/PaymentMethodCard.jsx` - Payment method UI
9. `client/src/components/PaymentModal.jsx` - Stripe payment modal
10. `nostia-mobile/src/utils/haptics.ts` - Haptic feedback
11. `nostia-mobile/src/components/Toast.tsx` - Toast config
12. `nostia-mobile/src/components/AnimatedButton.tsx` - Animated button
13. `nostia-mobile/src/components/SkeletonLoader.tsx` - Skeleton loader
14. `nostia-mobile/src/screens/PaymentScreen.tsx` - Stripe payment
15. `.env` - Environment variables
16. `client/.env` - Web environment
17. `nostia-mobile/.env` - Mobile environment
18. `scripts/migrate-stripe.js` - Database migration

### Must Update (11 files)
1. `database/db.js` - Add Stripe tables
2. `server.js` - Add payment routes
3. `models/Vault.js` - Add Stripe methods
4. `client/src/App.jsx` - UI improvements + payment
5. `client/src/api.js` - Add payments API
6. `nostia-mobile/App.tsx` - Add toast + payment screen
7. `nostia-mobile/src/navigation/MainNavigator.tsx` - Animated tabs
8. `nostia-mobile/src/screens/HomeScreen.tsx` - Haptics + animations
9. `nostia-mobile/src/screens/VaultScreen.tsx` - Add payment button
10. `nostia-mobile/src/services/api.ts` - Add payments API
11. `README.md` - Document Stripe setup

---

## Expected Outcomes

### User Experience
- ✅ Responsive, tactile feedback on all interactions
- ✅ Clear visual feedback for loading and empty states
- ✅ Smooth animations throughout the app
- ✅ Professional toast notifications
- ✅ Seamless Stripe payment integration

### Technical
- ✅ Server-side Stripe processing
- ✅ Webhook handling for payment confirmations
- ✅ Transaction history tracking
- ✅ Vault balances auto-update after payments
- ✅ Consistent dark theme across new components
- ✅ MVP-level polish without over-engineering

### Business
- ✅ Real payment processing capability
- ✅ Secure, PCI-compliant transactions
- ✅ Payment method management
- ✅ Transaction audit trail
- ✅ Production-ready payment infrastructure
