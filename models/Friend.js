const db = require('../database/db');

class Friend {
  // Send friend request
  static sendRequest(userId, friendId) {
    if (userId === friendId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if request already exists
    const existing = db.prepare(`
      SELECT * FROM friends
      WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)
    `).get(userId, friendId, friendId, userId);

    if (existing) {
      throw new Error('Friend request already exists');
    }

    const stmt = db.prepare(`
      INSERT INTO friends (userId, friendId, status)
      VALUES (?, ?, 'pending')
    `);

    const result = stmt.run(userId, friendId);
    return { id: result.lastInsertRowid, userId, friendId, status: 'pending' };
  }

  // Accept friend request
  static acceptRequest(requestId) {
    const stmt = db.prepare(`
      UPDATE friends SET status = 'accepted' WHERE id = ?
    `);

    stmt.run(requestId);
    return this.getById(requestId);
  }

  // Reject friend request
  static rejectRequest(requestId) {
    const stmt = db.prepare(`
      DELETE FROM friends WHERE id = ?
    `);

    return stmt.run(requestId);
  }

  // Get all friends for a user (accepted only)
  static getFriends(userId) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.name, u.homeStatus, u.latitude, u.longitude
      FROM users u
      INNER JOIN friends f ON (
        (f.userId = ? AND f.friendId = u.id) OR
        (f.friendId = ? AND f.userId = u.id)
      )
      WHERE f.status = 'accepted'
    `);

    return stmt.all(userId, userId);
  }

  // Get pending friend requests for a user
  static getPendingRequests(userId) {
    const stmt = db.prepare(`
      SELECT f.id, f.userId, f.friendId, f.createdAt,
             u.username, u.name
      FROM friends f
      INNER JOIN users u ON f.userId = u.id
      WHERE f.friendId = ? AND f.status = 'pending'
    `);

    return stmt.all(userId);
  }

  // Get sent requests
  static getSentRequests(userId) {
    const stmt = db.prepare(`
      SELECT f.id, f.userId, f.friendId, f.createdAt,
             u.username, u.name
      FROM friends f
      INNER JOIN users u ON f.friendId = u.id
      WHERE f.userId = ? AND f.status = 'pending'
    `);

    return stmt.all(userId);
  }

  // Get by ID
  static getById(id) {
    const stmt = db.prepare('SELECT * FROM friends WHERE id = ?');
    return stmt.get(id);
  }

  // Remove friend
  static removeFriend(userId, friendId) {
    const stmt = db.prepare(`
      DELETE FROM friends
      WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)
    `);

    return stmt.run(userId, friendId, friendId, userId);
  }
}

module.exports = Friend;
