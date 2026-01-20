require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import middleware
const { generateToken, authenticateToken, optionalAuth } = require('./middleware/auth');

// Import models
const User = require('./models/User');
const Friend = require('./models/Friend');
const Trip = require('./models/Trip');
const Event = require('./models/Event');
const Vault = require('./models/Vault');
const Feed = require('./models/Feed');
const Adventure = require('./models/Adventure');

// Import services
const AIService = require('./services/aiService');
const StripeService = require('./services/stripeService');
const Payment = require('./models/Payment');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Nostia MVP Backend API',
    version: '1.0.0',
    features: [
      'Friend Integration',
      'Social Feed & Events',
      'Trip Planning + Vault',
      'Adventure Discovery',
      'AI-powered content generation'
    ]
  });
});

// ==================== AUTHENTICATION ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Validation
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    if (email) {
      const existingEmail = User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Create user
    const user = User.create({ username, email, password, name });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user (need password for verification)
    const userWithPassword = User.findByUsername(username);
    if (!userWithPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = User.verifyPassword(password, userWithPassword.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from response
    const user = User.findById(userWithPassword.id);

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/users/me', authenticateToken, (req, res) => {
  try {
    const user = User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current user
app.put('/api/users/me', authenticateToken, (req, res) => {
  try {
    const updates = req.body;
    const user = User.update(req.user.id, updates);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FRIEND ROUTES ====================

// Get all friends
app.get('/api/friends', authenticateToken, (req, res) => {
  try {
    const friends = Friend.getFriends(req.user.id);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending friend requests
app.get('/api/friends/requests', authenticateToken, (req, res) => {
  try {
    const received = Friend.getPendingRequests(req.user.id);
    const sent = Friend.getSentRequests(req.user.id);
    res.json({ received, sent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
app.post('/api/friends/request', authenticateToken, (req, res) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID is required' });
    }

    const request = Friend.sendRequest(req.user.id, friendId);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Accept friend request
app.post('/api/friends/accept/:requestId', authenticateToken, (req, res) => {
  try {
    const { requestId } = req.params;
    const request = Friend.acceptRequest(requestId);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject friend request
app.delete('/api/friends/reject/:requestId', authenticateToken, (req, res) => {
  try {
    const { requestId } = req.params;
    Friend.rejectRequest(requestId);
    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove friend
app.delete('/api/friends/:friendId', authenticateToken, (req, res) => {
  try {
    const { friendId } = req.params;
    Friend.removeFriend(req.user.id, friendId);
    res.json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRIP ROUTES ====================

// Get all trips for current user
app.get('/api/trips', authenticateToken, (req, res) => {
  try {
    const trips = Trip.getUserTrips(req.user.id);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's pending trip invitations (must be before /api/trips/:id)
app.get('/api/trips/invitations', authenticateToken, (req, res) => {
  try {
    const invitations = Trip.getUserInvitations(req.user.id);
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to trip invitation (must be before /api/trips/:id)
app.post('/api/trips/invitations/:id/respond', authenticateToken, (req, res) => {
  try {
    const { accept } = req.body;
    const trip = Trip.respondToInvitation(req.params.id, req.user.id, accept);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get trip by ID
app.get('/api/trips/:id', authenticateToken, (req, res) => {
  try {
    const trip = Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new trip
app.post('/api/trips', authenticateToken, (req, res) => {
  try {
    const tripData = {
      ...req.body,
      createdBy: req.user.id
    };

    const trip = Trip.create(tripData);
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update trip
app.put('/api/trips/:id', authenticateToken, (req, res) => {
  try {
    const trip = Trip.update(req.params.id, req.body);
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete trip
app.delete('/api/trips/:id', authenticateToken, (req, res) => {
  try {
    Trip.delete(req.params.id);
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add participant to trip
app.post('/api/trips/:id/participants', authenticateToken, (req, res) => {
  try {
    const { userId } = req.body;
    Trip.addParticipant(req.params.id, userId);
    const trip = Trip.findById(req.params.id);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove participant from trip
app.delete('/api/trips/:id/participants/:userId', authenticateToken, (req, res) => {
  try {
    Trip.removeParticipant(req.params.id, req.params.userId);
    const trip = Trip.findById(req.params.id);
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer vault leader
app.post('/api/trips/:id/vault-leader', authenticateToken, (req, res) => {
  try {
    const { newLeaderId } = req.body;
    const trip = Trip.transferVaultLeader(req.params.id, newLeaderId, req.user.id);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Invite user to trip
app.post('/api/trips/:id/invite', authenticateToken, (req, res) => {
  try {
    const { userId } = req.body;
    const trip = Trip.inviteUser(req.params.id, userId, req.user.id);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== EVENT ROUTES ====================

// Get all events
app.get('/api/events', optionalAuth, (req, res) => {
  try {
    const events = Event.getAll();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming events
app.get('/api/events/upcoming', (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const events = Event.getUpcoming(limit);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
app.get('/api/events/:id', (req, res) => {
  try {
    const event = Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new event
app.post('/api/events', authenticateToken, (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user.id
    };

    const event = Event.create(eventData);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.put('/api/events/:id', authenticateToken, (req, res) => {
  try {
    const event = Event.update(req.params.id, req.body);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', authenticateToken, (req, res) => {
  try {
    Event.delete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VAULT ROUTES ====================

// Get trip vault summary
app.get('/api/vault/trip/:tripId', authenticateToken, (req, res) => {
  try {
    const summary = Vault.getTripSummary(req.params.tripId, req.user.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vault entry (expense)
app.post('/api/vault', authenticateToken, (req, res) => {
  try {
    const entry = Vault.createEntry(req.body);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark split as paid
app.put('/api/vault/splits/:splitId/paid', authenticateToken, (req, res) => {
  try {
    Vault.markSplitPaid(req.params.splitId);
    res.json({ message: 'Split marked as paid' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vault entry
app.delete('/api/vault/:id', authenticateToken, (req, res) => {
  try {
    Vault.deleteEntry(req.params.id);
    res.json({ message: 'Vault entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FEED ROUTES ====================

// Get user feed
app.get('/api/feed', authenticateToken, (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const posts = Feed.getUserFeed(req.user.id, limit);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get public feed
app.get('/api/feed/public', (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const posts = Feed.getAll(limit);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create feed post
app.post('/api/feed', authenticateToken, (req, res) => {
  try {
    const postData = {
      ...req.body,
      userId: req.user.id
    };

    const post = Feed.createPost(postData);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete feed post
app.delete('/api/feed/:id', authenticateToken, (req, res) => {
  try {
    Feed.delete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADVENTURE ROUTES ====================

// Get all adventures
app.get('/api/adventures', (req, res) => {
  try {
    const { category, difficulty, search } = req.query;

    let adventures;
    if (search) {
      adventures = Adventure.search(search);
    } else if (category) {
      adventures = Adventure.getByCategory(category);
    } else if (difficulty) {
      adventures = Adventure.getByDifficulty(difficulty);
    } else {
      adventures = Adventure.getAll();
    }

    res.json(adventures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adventure by ID
app.get('/api/adventures/:id', (req, res) => {
  try {
    const adventure = Adventure.findById(req.params.id);
    if (!adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }
    res.json(adventure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create adventure (admin only for MVP)
app.post('/api/adventures', authenticateToken, (req, res) => {
  try {
    const adventure = Adventure.create(req.body);
    res.status(201).json(adventure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STRIPE PAYMENT ROUTES ====================

// Create payment intent for vault split
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
  try {
    const { vaultSplitId } = req.body;

    if (!vaultSplitId) {
      return res.status(400).json({ error: 'vaultSplitId is required' });
    }

    // Get split details with trip and recipient info
    const db = require('./database/db');
    const split = db.prepare(`
      SELECT vs.*, ve.tripId, ve.paidBy as recipientUserId, ve.currency
      FROM vault_splits vs
      INNER JOIN vault_entries ve ON vs.vaultEntryId = ve.id
      WHERE vs.id = ?
    `).get(vaultSplitId);

    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    // Verify the requesting user is the one who owes money
    if (split.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized - you do not owe this split' });
    }

    // Check if already paid
    if (split.paid) {
      return res.status(400).json({ error: 'Split already paid' });
    }

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent(
      split.amount,
      split.currency || 'usd',
      req.user.id,
      split.recipientUserId,
      vaultSplitId,
      split.tripId
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: split.amount,
      currency: split.currency || 'usd'
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment (called after successful Stripe confirmation on client)
app.post('/api/payments/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    const transaction = await StripeService.confirmPayment(paymentIntentId);

    res.json({
      success: true,
      transaction,
      message: 'Payment confirmed and vault updated'
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history for a trip
app.get('/api/payments/trip/:tripId/history', authenticateToken, (req, res) => {
  try {
    const tripId = parseInt(req.params.tripId);

    // Verify user is a trip participant
    const db = require('./database/db');
    const participant = db.prepare(`
      SELECT * FROM trip_participants
      WHERE tripId = ? AND userId = ?
    `).get(tripId, req.user.id);

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant of this trip' });
    }

    const transactions = StripeService.getTransactionHistory(tripId);
    res.json(transactions);
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all unpaid splits for current user
app.get('/api/payments/unpaid-splits', authenticateToken, (req, res) => {
  try {
    const unpaidSplits = StripeService.getUserUnpaidSplits(req.user.id);
    res.json(unpaidSplits);
  } catch (error) {
    console.error('Get unpaid splits error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler (must be before express.json() middleware for raw body)
// Note: This needs to be moved before app.use(express.json()) for proper webhook verification
// For now, we'll handle it here with a workaround
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('📥 Received Stripe webhook:', event.type);

    await StripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Get user payment methods
app.get('/api/payment-methods', authenticateToken, (req, res) => {
  try {
    const methods = Payment.getUserPaymentMethods(req.user.id);
    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set default payment method
app.put('/api/payment-methods/:id/default', authenticateToken, (req, res) => {
  try {
    const paymentMethodId = parseInt(req.params.id);

    // Verify the payment method belongs to the user
    const method = Payment.getPaymentMethod(paymentMethodId, req.user.id);
    if (!method) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    Payment.setDefaultPaymentMethod(req.user.id, paymentMethodId);

    res.json({ message: 'Default payment method updated', paymentMethodId });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete payment method
app.delete('/api/payment-methods/:id', authenticateToken, (req, res) => {
  try {
    const paymentMethodId = parseInt(req.params.id);

    // Verify the payment method belongs to the user
    const method = Payment.getPaymentMethod(paymentMethodId, req.user.id);
    if (!method) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    Payment.deletePaymentMethod(paymentMethodId, req.user.id);

    res.json({ message: 'Payment method deleted', paymentMethodId });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI ROUTES ====================

// Generate AI content
app.post('/api/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { task, input } = req.body;

    if (!task || !input) {
      return res.status(400).json({ error: 'Task and input are required' });
    }

    const generatedText = await AIService.generate(task, input);

    res.json({
      task,
      generatedText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Chat endpoint for conversational interactions
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await AIService.chat(message, context);

    res.json({
      message: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== UTILITY ROUTES ====================

// Search users (for adding friends)
app.get('/api/users/search', authenticateToken, (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = User.getAll();
    const results = users.filter(user =>
      user.id !== req.user.id && (
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.name.toLowerCase().includes(query.toLowerCase())
      )
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('🚀  NOSTIA MVP Backend Server');
  console.log('🚀 ========================================');
  console.log(`🚀  Server running on port ${PORT}`);
  console.log(`🚀  API URL: http://localhost:${PORT}`);
  console.log(`🚀  Mobile: Use your local IP address`);
  console.log('🚀 ========================================');
  console.log('🚀  Features:');
  console.log('🚀  ✅ Friend Integration');
  console.log('🚀  ✅ Social Feed & Events');
  console.log('🚀  ✅ Trip Planning + Vault');
  console.log('🚀  ✅ Adventure Discovery');
  console.log('🚀  ✅ AI Content Generation');
  console.log('🚀 ========================================\n');
});

module.exports = app;
