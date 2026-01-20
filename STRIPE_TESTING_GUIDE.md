# Stripe Payment Testing Guide

## 🎯 How to Test Stripe Payments in Nostia

### Prerequisites

1. **Get Stripe Test API Keys**
   - Sign up at https://dashboard.stripe.com/register
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

2. **Add Keys to Environment Files**

   **Root `.env`:**
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

   **`client/.env`:**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   ```

3. **Restart the Backend Server**
   ```bash
   npm start
   ```

4. **Restart the Web Client**
   ```bash
   cd client
   npm run dev
   ```

---

## 📝 Step-by-Step Testing Process

### Step 1: Create a Trip with Multiple Participants

1. Login to Nostia web app (testuser / password123)
2. Go to **Trips** tab
3. Click **+** to create a new trip
4. Fill in:
   - Title: "Weekend Getaway"
   - Destination: "Beach Resort"
   - Start Date: (any future date)
5. Click **Create Trip**

### Step 2: Add Expense to Trip Vault

1. Click **View Vault** on your trip
2. Click **+ Add Expense** button
3. Fill in the form:
   - Description: "Hotel Room"
   - Amount: 200
   - Category: Accommodation
4. Click **Add Expense**

**What happens:**
- Expense is created and split equally among all trip participants
- If you're the one who added it, you paid $200
- Other participants now owe you their share

### Step 3: View Unpaid Splits

The Vault modal will show:

- **Trip Summary**: Total expenses
- **Expenses**: List of all expenses with who paid
- **Your Unpaid Expenses**: Red cards showing what YOU owe others
- **Balances**: Summary of who owes who

### Step 4: Pay with Stripe Test Card

1. If you see an unpaid expense (red card), click **💳 Pay with Stripe**
2. The Stripe payment modal opens
3. Enter test card details:

   **Successful Payment:**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/25)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

4. Click **Pay $XX.XX**
5. Wait for payment to process

**Result:**
- ✅ Green toast: "Payment successful!"
- The unpaid split disappears
- Balances update automatically

---

## 🧪 Stripe Test Cards

### Successful Payments
```
Card: 4242 4242 4242 4242
Result: Payment succeeds
```

### Declined Payment
```
Card: 4000 0000 0000 0002
Result: Card is declined
```

### Requires Authentication (3D Secure)
```
Card: 4000 0025 0000 3155
Result: Triggers 3D Secure authentication modal
```

### Insufficient Funds
```
Card: 4000 0000 0000 9995
Result: Insufficient funds error
```

---

## 🔍 What Happens Behind the Scenes

1. **Create Expense** → Creates vault entry and splits in database
2. **Click Pay with Stripe** → Backend creates Stripe Payment Intent
3. **Enter Card Details** → Stripe Elements securely handles card info
4. **Submit Payment** → Stripe processes payment
5. **Success** → Webhook updates database, marks split as paid
6. **Vault Refreshes** → Shows updated balances

---

## 🎨 Visual Flow in UI

```
Trips Tab
  └─> Click "View Vault"
       └─> Vault Modal Opens
            ├─> Summary (Green card with total)
            ├─> "+ Add Expense" button
            │    └─> Form to add new expense
            ├─> Expenses List (All expenses)
            ├─> Your Unpaid Expenses (Red cards)
            │    └─> "💳 Pay with Stripe" button
            │         └─> Payment Modal (Stripe Elements)
            │              └─> Enter card → Pay → Success!
            └─> Balances (Who owes who)
```

---

## 🚀 Quick Test Scenario

**Two-User Test (Recommended):**

1. **User 1** (testuser):
   - Create trip "Beach Trip"
   - Add expense: "Hotel $200"
   - User 1 paid, User 2 owes $100

2. **User 2** (create new user via Signup):
   - Login as new user
   - Join the trip (or be added by User 1)
   - Go to Vault → See "$100" unpaid split
   - Click "Pay with Stripe"
   - Use card: 4242 4242 4242 4242
   - Payment succeeds
   - Balance cleared!

---

## ⚠️ Important Notes

- All test cards work in **test mode only**
- Real charges require **live mode** API keys
- Webhook secret is optional for basic testing
- For webhook testing, use Stripe CLI or ngrok

---

## 🐛 Troubleshooting

**Payment modal doesn't open:**
- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set in `client/.env`
- Restart Vite dev server

**Payment fails immediately:**
- Check backend console for errors
- Verify `STRIPE_SECRET_KEY` is set in root `.env`
- Restart backend server

**"Failed to initialize payment":**
- Check if backend is running
- Verify vault split exists
- Check backend logs for API errors

---

## 📚 Additional Resources

- Stripe Test Cards: https://stripe.com/docs/testing
- Stripe Dashboard: https://dashboard.stripe.com/test/payments
- Nostia API Docs: See `API_DOCUMENTATION.md`
