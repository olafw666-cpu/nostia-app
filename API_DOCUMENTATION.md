# NOSTIA MVP - API DOCUMENTATION

## Overview
Complete API documentation for the Nostia MVP backend built according to the specification.

**Base URL:** `http://localhost:3000/api`

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "name": "string (required)",
  "email": "string (optional)"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "testuser",
    "name": "Test User",
    "email": "test@example.com",
    "homeStatus": "closed"
  }
}
```

### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "testuser",
    "name": "Test User"
  }
}
```

### GET /api/users/me 🔒
Get current user profile (requires authentication).

**Response:**
```json
{
  "id": 1,
  "username": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "homeStatus": "open",
  "latitude": null,
  "longitude": null
}
```

### PUT /api/users/me 🔒
Update current user profile.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "homeStatus": "open" | "closed",
  "latitude": number,
  "longitude": number
}
```

---

## Friends

### GET /api/friends 🔒
Get all accepted friends for current user.

**Response:**
```json
[
  {
    "id": 2,
    "username": "friend1",
    "name": "Friend One",
    "homeStatus": "open",
    "latitude": null,
    "longitude": null
  }
]
```

### GET /api/friends/requests 🔒
Get pending friend requests (received and sent).

**Response:**
```json
{
  "received": [
    {
      "id": 1,
      "userId": 2,
      "friendId": 1,
      "username": "sender_username",
      "name": "Sender Name",
      "createdAt": "2025-01-18T..."
    }
  ],
  "sent": [
    {
      "id": 2,
      "userId": 1,
      "friendId": 3,
      "username": "recipient_username",
      "name": "Recipient Name",
      "createdAt": "2025-01-18T..."
    }
  ]
}
```

### POST /api/friends/request 🔒
Send a friend request.

**Request Body:**
```json
{
  "friendId": 2
}
```

### POST /api/friends/accept/:requestId 🔒
Accept a friend request.

**Response:**
```json
{
  "id": 1,
  "userId": 2,
  "friendId": 1,
  "status": "accepted"
}
```

### DELETE /api/friends/reject/:requestId 🔒
Reject a friend request.

### DELETE /api/friends/:friendId 🔒
Remove a friend.

### GET /api/users/search?query=username 🔒
Search for users to add as friends.

**Response:**
```json
[
  {
    "id": 3,
    "username": "searchresult",
    "name": "Search Result",
    "homeStatus": "closed"
  }
]
```

---

## Trips

### GET /api/trips 🔒
Get all trips for current user.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Mountain Adventure",
    "description": "A weekend in the mountains",
    "destination": "Rocky Mountains",
    "startDate": "2025-06-15",
    "endDate": "2025-06-22",
    "createdBy": 1,
    "creatorUsername": "testuser",
    "creatorName": "Test User",
    "itinerary": "AI generated itinerary...",
    "participants": [
      {
        "id": 1,
        "username": "testuser",
        "name": "Test User",
        "role": "creator"
      }
    ]
  }
]
```

### GET /api/trips/:id 🔒
Get trip details by ID.

### POST /api/trips 🔒
Create a new trip.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string",
  "destination": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "itinerary": "string (optional, can be AI-generated)"
}
```

### PUT /api/trips/:id 🔒
Update trip details.

### DELETE /api/trips/:id 🔒
Delete a trip.

### POST /api/trips/:id/participants 🔒
Add a participant to a trip.

**Request Body:**
```json
{
  "userId": 2
}
```

### DELETE /api/trips/:id/participants/:userId 🔒
Remove a participant from a trip.

---

## Events

### GET /api/events
Get all events (public access with optional auth).

### GET /api/events/upcoming?limit=10
Get upcoming events.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Beach Cleanup",
    "description": "Community beach cleanup event",
    "location": "Santa Monica Beach",
    "eventDate": "2025-07-15T10:00:00Z",
    "createdBy": 1,
    "creatorUsername": "testuser",
    "creatorName": "Test User",
    "type": "social"
  }
]
```

### GET /api/events/:id
Get event by ID.

### POST /api/events 🔒
Create a new event.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string",
  "location": "string",
  "eventDate": "ISO 8601 datetime",
  "type": "social" | "adventure" | "meetup"
}
```

### PUT /api/events/:id 🔒
Update event.

### DELETE /api/events/:id 🔒
Delete event.

---

## Vault (Expense Tracking)

### GET /api/vault/trip/:tripId 🔒
Get complete vault summary for a trip.

**Response:**
```json
{
  "tripId": 1,
  "totalExpenses": 850.00,
  "entryCount": 5,
  "balances": [
    {
      "userId": 1,
      "username": "testuser",
      "name": "Test User",
      "paid": 500.00,
      "owes": 283.33,
      "balance": 216.67
    }
  ],
  "entries": [
    {
      "id": 1,
      "tripId": 1,
      "description": "Hotel booking",
      "amount": 300.00,
      "currency": "USD",
      "paidBy": 1,
      "paidByUsername": "testuser",
      "paidByName": "Test User",
      "category": "accommodation",
      "date": "2025-06-15",
      "splits": [
        {
          "id": 1,
          "userId": 2,
          "username": "friend1",
          "name": "Friend One",
          "amount": 150.00,
          "paid": false
        }
      ]
    }
  ]
}
```

### POST /api/vault 🔒
Create a new vault entry (expense).

**Request Body:**
```json
{
  "tripId": 1,
  "description": "Dinner at restaurant",
  "amount": 120.50,
  "currency": "USD",
  "paidBy": 1,
  "category": "food",
  "date": "2025-06-16",
  "splits": [
    {
      "userId": 2,
      "amount": 60.25
    },
    {
      "userId": 3,
      "amount": 60.25
    }
  ]
}
```

### PUT /api/vault/splits/:splitId/paid 🔒
Mark a split as paid.

### DELETE /api/vault/:id 🔒
Delete a vault entry.

---

## Feed (Social Feed)

### GET /api/feed?limit=50 🔒
Get personalized feed (user + friends' posts).

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "username": "testuser",
    "name": "Test User",
    "content": "Just completed an amazing hike!",
    "type": "text",
    "relatedTripId": 1,
    "relatedEventId": null,
    "tripTitle": "Mountain Adventure",
    "eventTitle": null,
    "createdAt": "2025-01-18T..."
  }
]
```

### GET /api/feed/public?limit=50
Get public feed (all posts).

### POST /api/feed 🔒
Create a new feed post.

**Request Body:**
```json
{
  "content": "string (required)",
  "type": "text" | "image" | "trip" | "event",
  "relatedTripId": number (optional),
  "relatedEventId": number (optional)
}
```

### DELETE /api/feed/:id 🔒
Delete a feed post.

---

## Adventures (Discovery)

### GET /api/adventures
Get all adventures.

**Query Parameters:**
- `category`: Filter by category (hiking, climbing, water-sports, etc.)
- `difficulty`: Filter by difficulty (easy, moderate, hard)
- `search`: Search by title, description, or location

**Response:**
```json
[
  {
    "id": 1,
    "title": "Mountain Hiking Trail",
    "description": "Beautiful scenic trail with amazing views",
    "location": "Rocky Mountains",
    "category": "hiking",
    "difficulty": "moderate",
    "imageUrl": null,
    "createdAt": "2025-01-18T..."
  }
]
```

### GET /api/adventures/:id
Get adventure by ID.

### POST /api/adventures 🔒
Create a new adventure (admin/authenticated users).

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string",
  "location": "string",
  "category": "string",
  "difficulty": "easy" | "moderate" | "hard",
  "imageUrl": "string"
}
```

---

## AI Content Generation

### POST /api/ai/generate 🔒
Generate AI content using local DeepSeek model.

**Request Body:**
```json
{
  "task": "itinerary" | "trip_summary" | "event_description",
  "input": {
    "destination": "Rocky Mountains",
    "startDate": "2025-06-15",
    "endDate": "2025-06-22",
    "interests": ["hiking", "photography"],
    "participants": 3
  }
}
```

**Response:**
```json
{
  "task": "itinerary",
  "generatedText": "Day 1: Arrival in Rocky Mountains...",
  "timestamp": "2025-01-18T..."
}
```

**AI Tasks:**

1. **Itinerary Generation** (`task: "itinerary"`)
   - Input: destination, startDate, endDate, interests, participants
   - Output: Day-by-day trip itinerary

2. **Trip Summary** (`task: "trip_summary"`)
   - Input: title, destination, activities, highlights
   - Output: Engaging 2-3 sentence summary

3. **Event Description** (`task: "event_description"`)
   - Input: title, location, eventDate, type
   - Output: Inviting event description

**Note:** Falls back to template-based generation if DeepSeek model is unavailable.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Database Schema

**SQLite Database** located at: `database/nostia.db`

**Tables:**
- `users` - User accounts
- `friends` - Friend relationships
- `trips` - Trip planning
- `trip_participants` - Trip membership
- `events` - Social events
- `vault_entries` - Expense tracking
- `vault_splits` - Expense splitting
- `feed_posts` - Social feed
- `adventures` - Discovery content

---

## Test Data

The database is seeded with test users:

| Username | Password | Name |
|----------|----------|------|
| testuser | password123 | Test User |
| alex_explorer | password123 | Alex Rivera |
| sarah_wanderer | password123 | Sarah Chen |

---

## Success Criteria (from PDF Spec)

✅ **Friends can be added** - Friend Integration API implemented
✅ **Trips can be created and shared** - Trip Planning API implemented
✅ **Vault tracks group expenses** - Vault/Ledger API implemented
✅ **Local AI generates itinerary text** - AI endpoint with fallback implemented

---

## Development Notes

- JWT tokens expire after 7 days
- All timestamps are in ISO 8601 format
- Foreign key constraints are enabled
- Transactions are handled automatically by better-sqlite3
- CORS is enabled for all origins in development
