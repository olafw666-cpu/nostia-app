// server.js - Main Express Server
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nostia';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ========== MODELS ==========

// User Model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  homeLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  trips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  homeOpen: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'looking_for_adventure'], default: 'active' }
}, { timestamps: true });

UserSchema.index({ homeLocation: '2dsphere' });

const User = mongoose.model('User', UserSchema);

// Friend Request Model
const FriendRequestSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

const FriendRequest = mongoose.model('FriendRequest', FriendRequestSchema);

// Event Model
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String }
  },
  dateTime: { type: Date, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

EventSchema.index({ location: '2dsphere' });

const Event = mongoose.model('Event', EventSchema);

// Post Model
const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  photos: [{ type: String }],
  caption: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] },
    name: { type: String }
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Post = mongoose.model('Post', PostSchema);

// Trip Model
const TripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  destination: { type: String, required: true },
  dateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  itinerary: [{
    title: String,
    description: String,
    date: Date,
    location: String
  }],
  vault: {
    balance: { type: Number, default: 0 },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    transactions: [{
      type: { type: String, enum: ['add', 'spend'] },
      amount: Number,
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      description: String,
      date: { type: Date, default: Date.now }
    }]
  }
}, { timestamps: true });

const Trip = mongoose.model('Trip', TripSchema);

// ========== MIDDLEWARE ==========

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.userId = user.id;
    next();
  });
};

// ========== ROUTES ==========

// 1. USER AUTHENTICATION
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, username, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('friends', 'name username profilePhoto');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. FRIEND SYSTEM
app.post('/api/friends/request', authenticateToken, async (req, res) => {
  try {
    const { toUserId } = req.body;
    
    const existingRequest = await FriendRequest.findOne({
      fromUser: req.userId,
      toUser: toUserId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }
    
    const friendRequest = new FriendRequest({
      fromUser: req.userId,
      toUser: toUserId
    });
    await friendRequest.save();
    
    res.status(201).json(friendRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/friends/accept/:requestId', authenticateToken, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    
    if (!request || request.toUser.toString() !== req.userId) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    request.status = 'accepted';
    await request.save();
    
    await User.findByIdAndUpdate(request.fromUser, { $push: { friends: request.toUser } });
    await User.findByIdAndUpdate(request.toUser, { $push: { friends: request.fromUser } });
    
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/home-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.homeOpen = !user.homeOpen;
    await user.save();
    
    res.json({ homeOpen: user.homeOpen });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/friends/open-homes', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const openHomes = await User.find({
      _id: { $in: user.friends },
      homeOpen: true
    }).select('name username profilePhoto homeLocation');
    
    res.json(openHomes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. EVENTS
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const { title, description, location, dateTime } = req.body;
    
    const event = new Event({
      title,
      description,
      host: req.userId,
      location,
      dateTime,
      participants: [req.userId]
    });
    await event.save();
    
    await User.findByIdAndUpdate(req.userId, { $push: { events: event._id } });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/nearby', authenticateToken, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;
    
    const events = await Event.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(maxDistance)
        }
      },
      dateTime: { $gte: new Date() }
    }).populate('host', 'name username profilePhoto');
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. POSTS
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { photos, caption, location } = req.body;
    
    const post = new Post({
      author: req.userId,
      photos,
      caption,
      location
    });
    await post.save();
    
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/feed', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const posts = await Post.find({
      author: { $in: user.friends }
    })
      .populate('author', 'name username profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. TRIPS
app.post('/api/trips', authenticateToken, async (req, res) => {
  try {
    const { name, destination, dateRange } = req.body;
    
    const trip = new Trip({
      name,
      destination,
      dateRange,
      leader: req.userId,
      participants: [req.userId],
      vault: {
        balance: 0,
        admins: [req.userId],
        transactions: []
      }
    });
    await trip.save();
    
    await User.findByIdAndUpdate(req.userId, { $push: { trips: trip._id } });
    
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    const trips = await Trip.find({
      participants: req.userId
    }).populate('leader participants', 'name username profilePhoto');
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trips/:tripId/participants', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const trip = await Trip.findById(req.params.tripId);
    
    if (!trip.participants.includes(userId)) {
      trip.participants.push(userId);
      await trip.save();
      await User.findByIdAndUpdate(userId, { $push: { trips: trip._id } });
    }
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trips/:tripId/itinerary', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    trip.itinerary.push(req.body);
    await trip.save();
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. TRIP VAULT
app.post('/api/trips/:tripId/vault/add', authenticateToken, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const trip = await Trip.findById(req.params.tripId);
    
    trip.vault.balance += amount;
    trip.vault.transactions.push({
      type: 'add',
      amount,
      user: req.userId,
      description
    });
    await trip.save();
    
    res.json(trip.vault);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trips/:tripId/vault/spend', authenticateToken, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const trip = await Trip.findById(req.params.tripId);
    
    if (!trip.vault.admins.includes(req.userId)) {
      return res.status(403).json({ error: 'Unauthorized - not a vault admin' });
    }
    
    if (amount > trip.vault.balance) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    trip.vault.balance -= amount;
    trip.vault.transactions.push({
      type: 'spend',
      amount,
      user: req.userId,
      description
    });
    await trip.save();
    
    res.json(trip.vault);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. ADVENTURE DISCOVERY
app.get('/api/discover/nearby', authenticateToken, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;
    
    const adventurers = await User.find({
      _id: { $ne: req.userId },
      status: 'looking_for_adventure',
      homeLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).select('name username profilePhoto homeLocation');
    
    res.json(adventurers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/discover/match', authenticateToken, async (req, res) => {
  try {
    const { matchedUserId } = req.body;
    
    // In a real app, you'd integrate with a chat service like Firebase or Socket.io
    // For now, we'll just return a success message
    
    res.json({ 
      message: 'Match created',
      chatRoomId: `${req.userId}_${matchedUserId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nostia server running on port ${PORT}`);
});