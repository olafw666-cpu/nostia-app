const db = require('../database/db');

class Feed {
  static createPost(postData) {
    const { userId, content, type, imageData, relatedTripId, relatedEventId } = postData;

    const stmt = db.prepare(`
      INSERT INTO feed_posts (userId, content, type, imageData, relatedTripId, relatedEventId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      content || '',
      imageData ? 'photo' : (type || 'text'),
      imageData || null,
      relatedTripId || null,
      relatedEventId || null
    );

    return this.findById(result.lastInsertRowid);
  }

  static findById(id, currentUserId = null) {
    const stmt = db.prepare(`
      SELECT fp.*, u.username, u.name,
             t.title as tripTitle,
             e.title as eventTitle,
             (SELECT COUNT(*) FROM post_likes WHERE postId = fp.id) as likeCount,
             (SELECT COUNT(*) FROM post_comments WHERE postId = fp.id) as commentCount
      FROM feed_posts fp
      INNER JOIN users u ON fp.userId = u.id
      LEFT JOIN trips t ON fp.relatedTripId = t.id
      LEFT JOIN events e ON fp.relatedEventId = e.id
      WHERE fp.id = ?
    `);

    const post = stmt.get(id);

    if (post && currentUserId) {
      const liked = db.prepare('SELECT 1 FROM post_likes WHERE postId = ? AND userId = ?').get(id, currentUserId);
      post.isLiked = !!liked;
    }

    return post;
  }

  static getAll(limit = 50, currentUserId = null) {
    const stmt = db.prepare(`
      SELECT fp.*, u.username, u.name,
             t.title as tripTitle,
             e.title as eventTitle,
             (SELECT COUNT(*) FROM post_likes WHERE postId = fp.id) as likeCount,
             (SELECT COUNT(*) FROM post_comments WHERE postId = fp.id) as commentCount
      FROM feed_posts fp
      INNER JOIN users u ON fp.userId = u.id
      LEFT JOIN trips t ON fp.relatedTripId = t.id
      LEFT JOIN events e ON fp.relatedEventId = e.id
      ORDER BY fp.createdAt DESC
      LIMIT ?
    `);

    const posts = stmt.all(limit);

    if (currentUserId) {
      const likedPosts = db.prepare('SELECT postId FROM post_likes WHERE userId = ?').all(currentUserId);
      const likedSet = new Set(likedPosts.map(l => l.postId));
      posts.forEach(post => {
        post.isLiked = likedSet.has(post.id);
      });
    }

    return posts;
  }

  static getUserFeed(userId, limit = 50) {
    // Get posts from user and their friends
    const stmt = db.prepare(`
      SELECT fp.*, u.username, u.name,
             t.title as tripTitle,
             e.title as eventTitle,
             (SELECT COUNT(*) FROM post_likes WHERE postId = fp.id) as likeCount,
             (SELECT COUNT(*) FROM post_comments WHERE postId = fp.id) as commentCount
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

    const posts = stmt.all(userId, userId, userId, limit);

    // Add isLiked status for current user
    const likedPosts = db.prepare('SELECT postId FROM post_likes WHERE userId = ?').all(userId);
    const likedSet = new Set(likedPosts.map(l => l.postId));
    posts.forEach(post => {
      post.isLiked = likedSet.has(post.id);
    });

    return posts;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM feed_posts WHERE id = ?');
    return stmt.run(id);
  }

  // ===== LIKE METHODS =====

  static likePost(postId, userId) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO post_likes (postId, userId)
      VALUES (?, ?)
    `);
    stmt.run(postId, userId);
    return this.getLikeCount(postId);
  }

  static unlikePost(postId, userId) {
    const stmt = db.prepare('DELETE FROM post_likes WHERE postId = ? AND userId = ?');
    stmt.run(postId, userId);
    return this.getLikeCount(postId);
  }

  static getLikeCount(postId) {
    const result = db.prepare('SELECT COUNT(*) as count FROM post_likes WHERE postId = ?').get(postId);
    return result.count;
  }

  static isLikedByUser(postId, userId) {
    const result = db.prepare('SELECT 1 FROM post_likes WHERE postId = ? AND userId = ?').get(postId, userId);
    return !!result;
  }

  // ===== COMMENT METHODS =====

  static addComment(postId, userId, content) {
    const stmt = db.prepare(`
      INSERT INTO post_comments (postId, userId, content)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(postId, userId, content);
    return this.getCommentById(result.lastInsertRowid);
  }

  static getCommentById(id) {
    const stmt = db.prepare(`
      SELECT pc.*, u.username, u.name
      FROM post_comments pc
      INNER JOIN users u ON pc.userId = u.id
      WHERE pc.id = ?
    `);
    return stmt.get(id);
  }

  static getComments(postId, limit = 50) {
    const stmt = db.prepare(`
      SELECT pc.*, u.username, u.name
      FROM post_comments pc
      INNER JOIN users u ON pc.userId = u.id
      WHERE pc.postId = ?
      ORDER BY pc.createdAt ASC
      LIMIT ?
    `);
    return stmt.all(postId, limit);
  }

  static deleteComment(commentId, userId) {
    // Only allow the comment author to delete
    const stmt = db.prepare('DELETE FROM post_comments WHERE id = ? AND userId = ?');
    return stmt.run(commentId, userId);
  }

  static getCommentCount(postId) {
    const result = db.prepare('SELECT COUNT(*) as count FROM post_comments WHERE postId = ?').get(postId);
    return result.count;
  }
}

module.exports = Feed;
