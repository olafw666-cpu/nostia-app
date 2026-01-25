# NOSTIA MVP - Social Adventure Platform

A complete full-stack social adventure platform with friend management, trip planning, expense tracking (Vault), adventure discovery, real-time notifications, direct messaging, and AI-powered trip planning.

## Features

### Core Features
- **Authentication** - Secure login/register with JWT tokens
- **Friend Management** - Add friends, manage requests, view friend status
- **Trip Planning** - Create trips, invite participants, track expenses
- **Vault (Expense Tracking)** - Split expenses, track balances, Stripe payments
- **Adventure Discovery** - Browse and discover adventures by category
- **Social Feed** - Photo feed with likes, comments, and image uploads

### New Features (Latest Update)
- **Notifications System** - Real-time notifications for friend requests, trip invitations, and more
- **Direct Messaging** - Chat with friends in real-time
- **Photo Feed** - Share photos with captions, likes, and comments (Base64 storage)
- **Nearby Events** - Location-based event discovery using GPS
- **Friend House Status** - See if friends' homes are open/closed for visits
- **AI Trip Assistant** - AI-powered travel planning with itinerary generation
- **Responsive UI** - Mobile app adapts to all screen sizes (phones and tablets)
- **Delete Trips** - Remove trips with confirmation

## Architecture

- **Frontend:** React (Web Client) + React Native (Mobile via Expo Go)
- **Backend:** Node.js + Express
- **Database:** SQLite (no cloud dependencies)
- **AI:** Local DeepSeek model (with template fallback)
- **Payments:** Stripe integration

## Project Structure

```
nostia-app/
├── server.js                    # Main Express server
├── database/
│   └── db.js                    # SQLite database initialization
├── models/                      # Data models
│   ├── User.js
│   ├── Friend.js
│   ├── Trip.js
│   ├── Event.js
│   ├── Vault.js
│   ├── Feed.js
│   ├── Adventure.js
│   └── Message.js               # Direct messaging
├── middleware/
│   └── auth.js                  # JWT authentication
├── services/
│   ├── aiService.js             # AI integration
│   ├── stripeService.js         # Stripe payments
│   └── notificationService.js   # Push notifications
├── client/                      # React web client
│   ├── src/
│   │   ├── App.jsx              # Main app with all features
│   │   ├── api.js               # Complete API client
│   │   └── components/
│   │       ├── AIChatModal.jsx  # AI chat interface
│   │       └── PaymentModal.jsx # Stripe payments
│   └── package.json
├── nostia-mobile/               # React Native mobile app (Expo)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx       # Dashboard with AI button
│   │   │   ├── TripsScreen.tsx      # Trips with AI planning
│   │   │   ├── FriendsScreen.tsx    # Friends with house status
│   │   │   ├── ChatScreen.tsx       # Direct messaging
│   │   │   └── NotificationsScreen.tsx
│   │   ├── components/
│   │   │   ├── AIChatModal.tsx      # AI assistant
│   │   │   ├── CreatePostModal.tsx  # Photo posts
│   │   │   └── CommentsModal.tsx    # Post comments
│   │   ├── hooks/
│   │   │   └── useResponsive.ts     # Responsive dimensions
│   │   ├── utils/
│   │   │   └── responsive.ts        # Responsive utilities
│   │   └── services/
│   │       ├── api.ts               # Complete API client
│   │       ├── location.ts          # GPS location
│   │       └── notifications.ts     # Push notifications
│   └── package.json
└── README.md
```

## Quick Start

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
cd client && npm install && cd ..
```

4. **Start the backend server**
```bash
npm start
```
Server runs on `http://localhost:3000`

5. **Start the web client** (new terminal)
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

## Test Credentials

| Username | Password | Name |
|----------|----------|------|
| testuser | password123 | Test User |
| alex_explorer | password123 | Alex Rivera |
| sarah_wanderer | password123 | Sarah Chen |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile (including homeStatus)

### Friends
- `GET /api/friends` - Get all friends (includes homeStatus)
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:requestId` - Accept request
- `DELETE /api/friends/reject/:requestId` - Reject request

### Trips
- `GET /api/trips` - Get user trips
- `POST /api/trips` - Create trip
- `DELETE /api/trips/:id` - Delete trip
- `POST /api/trips/:id/invite` - Invite user to trip

### Feed
- `GET /api/feed` - Get user feed
- `POST /api/feed` - Create post (with optional imageData)
- `POST /api/feed/:id/like` - Like post
- `DELETE /api/feed/:id/like` - Unlike post
- `GET /api/feed/:id/comments` - Get comments
- `POST /api/feed/:id/comments` - Add comment

### Events
- `GET /api/events/upcoming` - Get upcoming events
- `GET /api/events/nearby?lat=X&lng=Y&radius=50` - Get nearby events

### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Messages
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create/get conversation with user
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message

### AI
- `POST /api/ai/generate` - Generate content (itinerary, summary)
- `POST /api/ai/chat` - Chat with AI assistant

### Vault
- `GET /api/vault/trip/:tripId` - Get trip expenses
- `POST /api/vault` - Create expense
- `PUT /api/vault/splits/:splitId/paid` - Mark as paid

## Mobile App Setup (Expo Go)

### Installation
```bash
cd nostia-mobile
npm install
```

### Configuration
Update the API URL in `nostia-mobile/src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://YOUR-LOCAL-IP:3000/api';
```
Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Running
```bash
npx expo start
```
Scan QR code with Expo Go app.

### Mobile Features
- **Home Screen** - Dashboard with stats, home status toggle, AI assistant button
- **Trips Screen** - Trip list with AI planning, vault access, delete option
- **Friends Screen** - Friend list with house status badges, direct messaging
- **Discover Screen** - Photo feed, adventures, events
- **Notifications Screen** - All notifications with unread badges
- **Chat Screen** - Direct messaging with friends
- **AI Chat Modal** - Travel planning assistant with quick actions

## AI Integration

### Using the AI Assistant

**Web Client:**
- Click the purple AI button (bottom-right corner) for general help
- Click "AI Plan" on any trip card for trip-specific planning

**Mobile App:**
- Tap the floating sparkles button on Home screen
- Tap "AI Plan" on any trip card in Trips screen

### AI Features
- Create detailed itineraries
- Activity recommendations
- Budget tips
- Packing lists
- Trip-context aware suggestions

### AI Setup (Optional)
The AI system falls back to templates if no model is running.

To use the local model:
```bash
cd deepseek-finetuned
# Windows: start-model.bat
# Mac/Linux: ./start-model.sh
```

## Stripe Payments

### Setup
1. Create account at [stripe.com](https://stripe.com)
2. Add keys to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Environment Variables

Create `.env` in root:
```env
PORT=3000
JWT_SECRET=your-secret-key
DEEPSEEK_URL=http://localhost:11434/api/generate
DEEPSEEK_MODEL=deepseek-finetuned
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Security

- JWT authentication (7-day expiration)
- Password hashing with bcrypt
- Secure token storage (SecureStore on mobile)
- Protected API routes

## Known Limitations (MVP)

- HTTP polling for messages (5-10 second intervals)
- Base64 image storage (5MB limit)
- Basic expense splitting (equal splits)
- Template-based AI fallback

## License

MIT

---

Happy adventuring with Nostia!
