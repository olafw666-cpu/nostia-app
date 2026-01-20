# NOSTIA MVP - Social Adventure Platform

A complete full-stack social adventure platform built according to the MVP specification with local DeepSeek AI integration, featuring friend management, trip planning, expense tracking (Vault), and adventure discovery.

## 🎯 MVP Features (Spec Compliance)

✅ **Friend Integration** - Add friends, manage requests, view friend status
✅ **Social Feed & Events** - Create/view events, share activities
✅ **Trip Planning + Vault** - Create trips, track group expenses (ledger only)
✅ **Adventure Discovery** - Browse and discover adventures
✅ **AI Content Generation** - Local DeepSeek integration for itineraries, summaries, descriptions

## 🏗️ Architecture (Per Spec)

- **Frontend:** React (Web Client)
- **Backend:** Node.js + Express
- **Database:** SQLite (no cloud dependencies)
- **AI:** Local DeepSeek model (internal use only, with template fallback)

## 📁 Project Structure

```
nostia-app/
├── server.js                    # Main Express server
├── database/
│   ├── db.js                    # SQLite database initialization
│   └── nostia.db                # SQLite database file (auto-created)
├── models/                      # Data models
│   ├── User.js
│   ├── Friend.js
│   ├── Trip.js
│   ├── Event.js
│   ├── Vault.js
│   ├── Feed.js
│   └── Adventure.js
├── middleware/
│   └── auth.js                  # JWT authentication
├── services/
│   ├── aiService.js             # AI integration (DeepSeek)
│   └── stripeService.js         # Stripe payment processing
├── deepseek-finetuned/          # Local AI model server
│   ├── server.py                # Python Flask inference server
│   ├── requirements.txt         # Python dependencies
│   ├── start-model.bat          # Windows startup script
│   ├── start-model.sh           # Mac/Linux startup script
│   ├── model.safetensors        # Fine-tuned model weights
│   ├── config.json              # Model configuration
│   ├── tokenizer.json           # Tokenizer data
│   └── README.md                # AI server documentation
├── client/                      # React web client (Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx              # Main React app
│   │   ├── api.js               # API client
│   │   └── components/
│   │       ├── AIChatModal.jsx  # AI chat interface
│   │       ├── PaymentModal.jsx # Stripe payment UI
│   │       └── ...
│   ├── postcss.config.js        # PostCSS config for Tailwind
│   └── package.json
├── nostia-mobile/               # React Native mobile app (Expo)
│   ├── App.tsx                  # Root component with auth flow
│   ├── src/
│   │   ├── screens/             # All app screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── TripsScreen.tsx
│   │   │   ├── FriendsScreen.tsx
│   │   │   ├── AdventuresScreen.tsx
│   │   │   └── VaultScreen.tsx
│   │   ├── components/          # Reusable components
│   │   │   ├── CreateTripModal.tsx
│   │   │   └── CreateExpenseModal.tsx
│   │   ├── navigation/          # Navigation structure
│   │   │   └── MainNavigator.tsx
│   │   └── services/
│   │       └── api.ts           # Complete API client
│   └── package.json
├── API_DOCUMENTATION.md         # Complete API docs
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nostia-app.git
cd nostia-app
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Start the backend server**
```bash
npm start
```

The server will start on `http://localhost:3000` and automatically:
- Initialize the SQLite database
- Create database tables
- Seed test data

5. **Start the web client** (in a new terminal)
```bash
cd client
npm run dev
```

The web client will start on `http://localhost:5173` (or similar Vite dev server)

## 🧪 Test Credentials

The database is pre-seeded with test users:

| Username | Password | Name |
|----------|----------|------|
| testuser | password123 | Test User |
| alex_explorer | password123 | Alex Rivera |
| sarah_wanderer | password123 | Sarah Chen |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/users/me` - Get current user (protected)
- `PUT /api/users/me` - Update user profile (protected)

### Friends
- `GET /api/friends` - Get all friends (protected)
- `GET /api/friends/requests` - Get friend requests (protected)
- `POST /api/friends/request` - Send friend request (protected)
- `POST /api/friends/accept/:requestId` - Accept request (protected)
- `DELETE /api/friends/reject/:requestId` - Reject request (protected)

### Trips
- `GET /api/trips` - Get user trips (protected)
- `POST /api/trips` - Create trip (protected)
- `PUT /api/trips/:id` - Update trip (protected)
- `DELETE /api/trips/:id` - Delete trip (protected)
- `POST /api/trips/:id/participants` - Add participant (protected)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/upcoming` - Get upcoming events
- `POST /api/events` - Create event (protected)

### Vault (Expense Tracking)
- `GET /api/vault/trip/:tripId` - Get trip expenses (protected)
- `POST /api/vault` - Create expense (protected)
- `PUT /api/vault/splits/:splitId/paid` - Mark as paid (protected)

### Feed
- `GET /api/feed` - Get user feed (protected)
- `POST /api/feed` - Create post (protected)

### Adventures
- `GET /api/adventures` - Get all adventures
- `POST /api/adventures` - Create adventure (protected)

### AI
- `POST /api/ai/generate` - Generate AI content (protected)

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details.

## 🤖 AI Integration

The app integrates with a local fine-tuned DeepSeek model for AI-powered content generation and trip planning assistance.

### Option 1: Use Fine-Tuned Model (Recommended)

The `deepseek-finetuned/` folder contains a custom fine-tuned model optimized for travel planning.

#### Requirements
- **Python 3.10+** with pip
- **~8GB RAM** minimum (16GB recommended)
- **~4GB disk space** for the model
- **CUDA** (optional, for GPU acceleration)

#### Quick Start

1. **Start the AI model server** (in a new terminal):

   **Windows:**
   ```bash
   cd deepseek-finetuned
   start-model.bat
   or 
   .\start-model.bat
   ```

   **Mac/Linux:**
   ```bash
   cd deepseek-finetuned
   chmod +x start-model.sh
   ./start-model.sh
   ```

   This will:
   - Create a Python virtual environment
   - Install dependencies (torch, transformers, flask)
   - Load and serve the model on `http://localhost:11434`

   **Note:** First startup may take several minutes to download PyTorch and load the model.

2. **Start the backend server** (in another terminal):
   ```bash
   npm start
   ```

3. **Start the web client** (in another terminal):
   ```bash
   cd client
   npm run dev
   ```

4. **Use AI features:**
   - Click the purple **AI button** (bottom-right corner) for general travel assistance
   - Click **"AI Plan"** on any trip card for trip-specific planning
   - Use quick actions: Create Itinerary, Activities, Budget Tips, Packing List

#### Manual Python Setup

If the startup scripts don't work:

```bash
cd deepseek-finetuned

# Create virtual environment
python -m venv venv

# Activate it
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python server.py
```

### Option 2: Use Ollama (Alternative)

If you prefer using Ollama instead of the fine-tuned model:

1. **Install Ollama** from [ollama.ai](https://ollama.ai)
2. **Pull a model:**
   ```bash
   ollama pull deepseek-r1:1.5b
   ```
3. **Update `.env`:**
   ```env
   DEEPSEEK_URL=http://localhost:11434/api/generate
   DEEPSEEK_MODEL=deepseek-r1:1.5b
   ```

### AI Features

| Feature | Description |
|---------|-------------|
| **AI Chat Assistant** | Conversational travel planning help |
| **Itinerary Generation** | Day-by-day trip planning |
| **Activity Recommendations** | Destination-specific suggestions |
| **Budget Tips** | Travel budgeting advice |
| **Packing Lists** | Customized packing suggestions |
| **Trip Summaries** | Engaging trip descriptions |
| **Event Descriptions** | Generate inviting event copy |

### AI Endpoints

- `POST /api/ai/generate` - Generate structured content (itinerary, summary, description)
- `POST /api/ai/chat` - Conversational AI for trip planning

### Fallback Mode

If the AI model is unavailable, the system automatically falls back to template-based generation. All features remain functional with pre-defined templates.

### Troubleshooting AI

| Issue | Solution |
|-------|----------|
| Model not loading | Ensure Python 3.10+ is installed and in PATH |
| Out of memory | Close other apps, or use CPU mode (slower but works) |
| Slow responses | First request loads model into memory; subsequent requests are faster |
| Connection refused | Ensure model server is running on port 11434 |
| CUDA errors | Model will auto-fallback to CPU if GPU unavailable |

## 🎨 Frontend Features

### Web Client (React + Vite)
- Authentication (login/register)
- Home dashboard with status toggle
- Trip management with creation modal
- Friends list with request handling
- Adventure discovery browser
- Social feed preview
- Responsive mobile-first design
- **Tailwind CSS** with PostCSS for styling
- Dark theme with gradient UI elements

### Mobile App (React Native + Expo)
- **Full feature parity with web app** - ALL features available on mobile
- Bottom tab navigation (Home, Trips, Discover, Friends)
- Professional authentication flow with gradient UI
- Complete trip management with Vault integration
- Friends list with request handling (send, accept, reject)
- Adventure discovery browser with category filters
- Social feed with trip/event posts
- Expense tracking with split calculations
- Modal-based creation flows (trips, expenses)
- Dark theme with gradient accents (#3B82F6 → #8B5CF6)
- Secure token storage (Expo SecureStore)
- Pull-to-refresh on all data screens
- Location available in: `nostia-mobile/`

## 💾 Database

**SQLite** database automatically created at: `database/nostia.db`

### Tables
- `users` - User accounts
- `friends` - Friend relationships and requests
- `trips` - Trip planning data
- `trip_participants` - Trip membership
- `events` - Social events
- `vault_entries` - Expense tracking
- `vault_splits` - Expense distribution
- `feed_posts` - Social feed
- `adventures` - Discovery content

## 🔒 Security

- JWT-based authentication (7-day expiration)
- Password hashing with bcrypt (10 salt rounds)
- Protected API routes with middleware
- Secure token storage (mobile: Expo SecureStore, web: localStorage)

**Note:** For production, update `JWT_SECRET` in `.env`:
```env
JWT_SECRET=your-secure-secret-key-here
```

## 💳 Stripe Payment Integration

Nostia includes full Stripe payment integration for vault expense settlements.

### Setup Stripe Account

1. **Create a Stripe account** at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. **Get your API keys** from [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. **Add keys to `.env` file** in the root directory:
   ```env
   STRIPE_SECRET_KEY=sk_test_...your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_...your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret
   ```

4. **Add publishable key to client `.env` files**:
   - `client/.env`:
     ```env
     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...your_stripe_publishable_key
     ```
   - `nostia-mobile/.env`:
     ```env
     EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your_stripe_publishable_key
     ```

### Testing Payments

Use these Stripe test cards (any future date, any CVC):

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

### Webhook Testing (Optional)

For local development, use the Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret to .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Features

- ✅ **Server-side payment processing** - All Stripe logic runs securely on the backend
- ✅ **Vault expense settlements** - Pay what you owe directly through the app
- ✅ **Transaction history** - Complete audit trail of all payments
- ✅ **Webhook handling** - Automatic vault balance updates after payment
- ✅ **Payment method management** - Save and manage cards for future use
- ✅ **Mobile & web support** - Stripe Elements (web) and PaymentSheet (mobile)

## 🎯 Success Criteria (From Spec)

✅ **Friends can be added** - Full friend integration with requests
✅ **Trips can be created and shared** - Complete trip planning with participants
✅ **Vault tracks group expenses** - Full expense ledger with splits and balances
✅ **Local AI generates itinerary text** - DeepSeek integration with fallback
✅ **Stripe payment processing** - Real payment integration for vault settlements

## 📱 Mobile Setup (Expo Go)

The mobile app has **complete feature parity** with the web version and runs on Expo Go.

### Installation

```bash
cd nostia-mobile
npm install
```

### Running on Expo Go

1. **Start the backend server** (from root directory):
```bash
npm start
```

2. **Update API endpoint** in `nostia-mobile/src/services/api.ts` (line 5):
   - Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update the URL:
   ```typescript
   const API_BASE_URL = 'http://YOUR-IP-ADDRESS:3000/api';
   ```
   - **Important:** Use your network IP, not localhost (e.g., `http://192.168.1.100:3000/api`)

3. **Start Expo** (from nostia-mobile directory):
```bash
npx expo start
```

4. **Scan QR code** with Expo Go app:
   - iOS: Download Expo Go from App Store, scan with Camera app
   - Android: Download Expo Go from Play Store, scan with Expo Go app

### Mobile Features

All screens fully implemented:
- **Home Screen:** Dashboard with stats, home status toggle, trip/event previews
- **Trips Screen:** List all trips, create trips with AI, view vault balances
- **Friends Screen:** Manage friends, send/accept/reject requests, search users
- **Discover Screen:** Browse adventures by category, view social feed
- **Vault Screen:** Track expenses, view balances, mark payments

Modals included:
- **Create Trip Modal:** Full form with AI itinerary generation
- **Create Expense Modal:** Add expenses with category selection

### Mobile Tech Stack
- React Native with Expo SDK
- React Navigation (Stack + Bottom Tabs)
- Expo SecureStore (token storage)
- Expo Linear Gradient (UI polish)
- Ionicons (icon library)
- axios (API client)

## 🛠️ Development

### Backend Development
```bash
npm run dev  # Start with nodemon for auto-reload
```

### Web Frontend Development
```bash
cd client
npm run dev  # Vite dev server with hot reload at http://localhost:5173
```

### Mobile Development
```bash
cd nostia-mobile
npx expo start  # Start Expo dev server, scan QR with Expo Go
```

### Database Reset
To reset the database, simply delete `database/nostia.db` and restart the server.

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000

# JWT
JWT_SECRET=nostia-secret-key-change-in-production

# DeepSeek AI Configuration
DEEPSEEK_URL=http://localhost:11434/api/generate
DEEPSEEK_MODEL=deepseek-finetuned
AI_TIMEOUT=60000

# Stripe (see Stripe section for details)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🚧 Known Limitations (MVP Scope)

- No image uploads (planned for future)
- No real-time notifications (planned for future)
- Basic expense splitting (equal splits only for MVP)
- Template-based AI fallback when DeepSeek unavailable
- Development CORS (allows all origins)

## 📚 Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [Nostia_MVP_AI_Code_Generation_Spec.pdf](./Nostia_MVP_AI_Code_Generation_Spec.pdf) - Original specification

## 🤝 Contributing

This is an MVP implementation. For production use:
1. Update JWT secret
2. Implement rate limiting
3. Add input validation middleware
4. Set up proper CORS origins
5. Add comprehensive error logging
6. Implement SSL/HTTPS
7. Add database migrations

## 📄 License

MIT

## 🎉 Success!

You now have a complete MVP implementation with:
- Working authentication system
- Friend management with requests
- Trip planning with participants
- Expense tracking (Vault) with splits
- Social feed and events
- Adventure discovery
- AI-powered content generation
- Both web and mobile clients

Test it out by:
1. Register/login with the web client
2. Create a trip
3. Add friends
4. Track expenses in the Vault
5. Browse adventures
6. Generate AI content

Happy adventuring with Nostia! 🏔️
