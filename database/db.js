const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'nostia.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      homeStatus TEXT DEFAULT 'closed',
      latitude REAL,
      longitude REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Friends table (many-to-many relationship)
  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      friendId INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friendId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, friendId)
    )
  `);

  // Trips table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      destination TEXT,
      startDate DATETIME,
      endDate DATETIME,
      createdBy INTEGER NOT NULL,
      itinerary TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Trip participants (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT DEFAULT 'participant',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(tripId, userId)
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      eventDate DATETIME,
      createdBy INTEGER NOT NULL,
      type TEXT DEFAULT 'social',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Vault entries (expense tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS vault_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      paidBy INTEGER NOT NULL,
      category TEXT DEFAULT 'general',
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (paidBy) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Vault splits (who owes what)
  db.exec(`
    CREATE TABLE IF NOT EXISTS vault_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vaultEntryId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      amount REAL NOT NULL,
      paid BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vaultEntryId) REFERENCES vault_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Feed posts
  db.exec(`
    CREATE TABLE IF NOT EXISTS feed_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      relatedTripId INTEGER,
      relatedEventId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (relatedTripId) REFERENCES trips(id) ON DELETE SET NULL,
      FOREIGN KEY (relatedEventId) REFERENCES events(id) ON DELETE SET NULL
    )
  `);

  // Adventures (discovery feature)
  db.exec(`
    CREATE TABLE IF NOT EXISTS adventures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      category TEXT,
      difficulty TEXT,
      imageUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stripe customer mapping
  db.exec(`
    CREATE TABLE IF NOT EXISTS stripe_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL,
      stripeCustomerId TEXT UNIQUE NOT NULL,
      email TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Payment methods (cards, bank accounts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      stripePaymentMethodId TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'card',
      brand TEXT,
      last4 TEXT,
      expiryMonth INTEGER,
      expiryYear INTEGER,
      isDefault BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Vault transactions (Stripe payment tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS vault_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vaultSplitId INTEGER NOT NULL,
      stripePaymentIntentId TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'usd',
      status TEXT DEFAULT 'pending',
      payerUserId INTEGER NOT NULL,
      recipientUserId INTEGER NOT NULL,
      tripId INTEGER NOT NULL,
      stripeChargeId TEXT,
      stripeFee REAL DEFAULT 0,
      netAmount REAL,
      errorMessage TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      FOREIGN KEY (vaultSplitId) REFERENCES vault_splits(id) ON DELETE CASCADE,
      FOREIGN KEY (payerUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipientUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
    )
  `);

  // Add indexes for faster lookups
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vault_transactions_trip ON vault_transactions(tripId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vault_transactions_status ON vault_transactions(status)`);

  // Trip invitations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId INTEGER NOT NULL,
      invitedUserId INTEGER NOT NULL,
      invitedBy INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      respondedAt DATETIME,
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (invitedUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (invitedBy) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(tripId, invitedUserId)
    )
  `);

  // Add vaultLeaderId column to trips if it doesn't exist
  try {
    db.exec(`ALTER TABLE trips ADD COLUMN vaultLeaderId INTEGER REFERENCES users(id)`);
  } catch (e) {
    // Column already exists
  }

  // Add Stripe-related columns to vault_splits if they don't exist
  try {
    db.exec(`ALTER TABLE vault_splits ADD COLUMN stripePayable BOOLEAN DEFAULT 1`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE vault_splits ADD COLUMN paidViaStripe BOOLEAN DEFAULT 0`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE vault_splits ADD COLUMN paidAt DATETIME`);
  } catch (e) {
    // Column already exists
  }

  console.log('✅ Database tables initialized successfully');
}

// Seed some initial data for testing
function seedDatabase() {
  try {
    // Check if we already have users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count > 0) {
      console.log('📊 Database already seeded');
      return;
    }

    // Create test users
    const hashedPassword = bcrypt.hashSync('password123', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password, name, homeStatus)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('testuser', 'test@nostia.com', hashedPassword, 'Test User', 'open');
    insertUser.run('alex_explorer', 'alex@nostia.com', hashedPassword, 'Alex Rivera', 'open');
    insertUser.run('sarah_wanderer', 'sarah@nostia.com', hashedPassword, 'Sarah Chen', 'closed');

    // Create some adventures
    const insertAdventure = db.prepare(`
      INSERT INTO adventures (title, description, location, category, difficulty)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertAdventure.run(
      'Mountain Hiking Trail',
      'Beautiful scenic trail with amazing views',
      'Rocky Mountains',
      'hiking',
      'moderate'
    );

    insertAdventure.run(
      'Kayaking Adventure',
      'Peaceful river kayaking experience',
      'Colorado River',
      'water-sports',
      'easy'
    );

    insertAdventure.run(
      'Rock Climbing',
      'Challenging climbing routes for experienced climbers',
      'Yosemite',
      'climbing',
      'hard'
    );

    console.log('✅ Database seeded with test data');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
}

// Initialize on module load
initializeDatabase();
seedDatabase();

module.exports = db;
