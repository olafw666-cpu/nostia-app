const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage
const users = [];

// Simple user class
class User {
  constructor(data) {
    this.id = Date.now().toString();
    this.username = data.username;
    this.password = data.password;
    this.name = data.name;
  }
  
  static async findOne(query) {
    return users.find(user => user.username === query.username);
  }
  
  async save() {
    users.push(this);
    return this;
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Nostia backend is running' });
});

app.post('/api/test-user', async (req, res) => {
  try {
    const testUser = {
      username: 'testuser',
      password: 'password123',
      name: 'Test User'
    };
    
    const existingUser = await User.findOne({ username: testUser.username });
    if (existingUser) {
      return res.json({ message: 'Test user already exists', user: { username: existingUser.username, name: existingUser.name } });
    }
    
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = new User({
      username: testUser.username,
      password: hashedPassword,
      name: testUser.name
    });
    
    await user.save();
    res.json({ message: 'Test user created successfully', user: { username: user.username, name: user.name } });
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
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ 
      token: 'dummy-token-for-testing',
      user: { 
        id: user.id, 
        username: user.username, 
        name: user.name 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Mobile app should connect to: http://localhost:${PORT}`);
});
