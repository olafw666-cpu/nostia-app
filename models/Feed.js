const db = require('../database/db');

class Feed {
  static createPost(postData) {
    const { userId, content, type, relatedTripId, relatedEventId } = postData;

    const stmt = db.prepare(`
      INSERT INTO feed_posts (userId, content, type, relatedTripId, relatedEventId)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      content,
      type || 'text',
      relatedTripId || null,
      relatedEventId || null
    );

    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT fp.*, u.username, u.name,
             t.title as tripTitle,
             e.title as eventTitle
      FROM feed_posts fp
      INNER JOIN users u ON fp.userId = u.id
      LEFT JOIN trips t ON fp.relatedTripId = t.id
      LEFT JOIN events e ON fp.relatedEventId = e.id
      WHERE fp.id = ?
    `);

    return stmt.get(id);
  }

  static getAll(limit = 50) {
    const stmt = db.prepare(`
      SELECT fp.*, u.username, u.name,
             t.title as tripTitle,
             e.title as eventTitle
      FROM feed_posts fp
      INNER JOIN users u ON fp.userId = u.id
      LEFT JOIN trips t ON fp.relatedTripId = t.id
      LEFT JOIN events e ON fp.relatedEventId = e.id
      ORDER BY fp.createdAt DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  static getUserFeed(userId, limit = 50) {
    // Get posts from user and their friends
    const stmt = db.prepare(`
      SELECT fp.*, u.username, u.name,
             t.title as tripTitle,
             e.title as eventTitle
      FROM feed_posts fp
      INNER JOIN users u ON fp.userId = u.id
      LEFT JOIN trips t ON fp.relatedTripId = t.id
      LEFT JOIN events e ON fp.relatedEventId = e.id
      WHERE fp.userId = ? OR fp.userId IN (
        SELECT friendId FROM friends WHERE userId = ? AND status = 'accepted'
        UNION
        SELECT userId FROM friends WHERE friendId = ? AND status = 'accepted'
      )
      ORDER BY fp.createdAt DESC
      LIMIT ?
    `);

    return stmt.all(userId, userId, userId, limit);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM feed_posts WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = Feed;
