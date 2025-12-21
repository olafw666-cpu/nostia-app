# 🗺️ Nostia - Social Adventure App

A mobile-first platform connecting travelers and adventurers for trip planning, event discovery, and spontaneous adventures.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/mongodb-v7.0-green.svg)

## ✨ Features

- 🎒 **Trip Planning** - Organize group trips with shared itineraries and real-time collaboration
- 💰 **Trip Vault** - Manage shared expenses with built-in fund management and transaction history
- 📍 **Event Discovery** - Find nearby events and meetups using geospatial queries
- 👥 **Friend System** - Connect with friends and see when their homes are open for hosting
- 🧭 **Adventure Matching** - Discover nearby adventurers looking to explore together
- 📱 **Social Feed** - Share and view adventure posts from friends with photos and locations
- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/nostia-app.git
cd nostia-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your configuration
# Make sure to change JWT_SECRET to a secure random string
```

4. **Start MongoDB**
```bash
# On macOS with Homebrew:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod

# On Windows:
# MongoDB runs as a service automatically after installation
```

5. **Run the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will be running at `http://localhost:3000`

## 📡 API Documentation

### Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "password": "securepassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword123"
}
```

#### Get Current User
```http
GET /api/users/me
Authorization: Bearer <your-jwt-token>
```

### Friend System

- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:requestId` - Accept friend request
- `PUT /api/users/home-status` - Toggle home open/closed status
- `GET /api/friends/open-homes` - View friends with open homes

### Trip Planning

- `POST /api/trips` - Create new trip
- `GET /api/trips` - Get user's trips
- `POST /api/trips/:tripId/participants` - Add participant to trip
- `POST /api/trips/:tripId/itinerary` - Add itinerary item
- `POST /api/trips/:tripId/vault/add` - Add funds to trip vault
- `POST /api/trips/:tripId/vault/spend` - Spend funds from vault

### Events

- `POST /api/events` - Create event
- `GET /api/events/nearby?longitude=-105.0&latitude=40.5&maxDistance=10000` - Find nearby events

### Social Features

- `POST /api/posts` - Create post
- `GET /api/posts/feed` - Get friend feed

### Discovery

- `GET /api/discover/nearby?longitude=-105.0&latitude=40.5` - Find nearby adventurers
- `POST /api/discover/match` - Match with adventurer

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database with geospatial indexing
- **Mongoose** - MongoDB object modeling

### Security
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing

### Frontend (Demo)
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## 📁 Project Structure
```
nostia-app/
├── server.js           # Main Express server with all routes and models
├── package.json        # Node.js dependencies and scripts
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── App.jsx            # React frontend demo (optional)
```

## 🔒 Security Best Practices

- ✅ Passwords are hashed with bcrypt before storing
- ✅ JWT tokens expire after 30 days
- ✅ Environment variables for sensitive data
- ✅ CORS enabled for controlled access
- ✅ Input validation on all endpoints
- ❌ Never commit `.env` file with real credentials
- ❌ Always use HTTPS in production
- ❌ Never log sensitive information

## 🧪 Testing the API

Use cURL, Postman, or any HTTP client to test the API:
```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","username":"testuser","password":"password123"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Test creating a trip (replace TOKEN with your JWT)
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Summer Adventure","destination":"Colorado","dateRange":{"start":"2025-06-01","end":"2025-06-07"}}'
```

## 🚀 Deployment

### Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create new app
heroku create nostia-api

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### MongoDB Atlas (Cloud Database)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### Environment Variables for Production
```bash
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nostia
JWT_SECRET=your-very-secure-random-secret-key
FRONTEND_URL=https://nostia.app
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see below for details:
```
MIT License

Copyright (c) 2025 Nostia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📧 Contact

- **Project Link**: https://github.com/YOUR-USERNAME/nostia-app
- **Email**: your.email@example.com
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)

## 🙏 Acknowledgments

- Built with passion for the adventure travel community
- Inspired by the need for better trip coordination tools
- Thanks to all contributors and testers

---

**Happy Adventuring! 🏔️🌊🏕️**
