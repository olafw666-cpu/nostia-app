const db = require('../database/db');

class AnalyticsSession {
  static startSession(userId, sessionId, platform, appVersion) {
    const stmt = db.prepare(`
      INSERT INTO analytics_sessions (userId, sessionId, startedAt, platform, appVersion)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)
    `);

    try {
      const result = stmt.run(userId || null, sessionId, platform || 'web', appVersion || null);
      return this.getBySessionId(sessionId);
    } catch (e) {
      // Session ID already exists - return existing
      return this.getBySessionId(sessionId);
    }
  }

  static endSession(sessionId) {
    const session = this.getBySessionId(sessionId);
    if (!session) return null;

    db.prepare(`
      UPDATE analytics_sessions
      SET endedAt = CURRENT_TIMESTAMP,
          durationSeconds = CAST((julianday(CURRENT_TIMESTAMP) - julianday(startedAt)) * 86400 AS INTEGER)
      WHERE sessionId = ?
    `).run(sessionId);

    return this.getBySessionId(sessionId);
  }

  static getBySessionId(sessionId) {
    return db.prepare('SELECT * FROM analytics_sessions WHERE sessionId = ?').get(sessionId);
  }

  static getRecentSessions(userId, limit = 50) {
    return db.prepare(`
      SELECT * FROM analytics_sessions WHERE userId = ? ORDER BY startedAt DESC LIMIT ?
    `).all(userId, limit);
  }

  static getSessionMetrics(startDate, endDate) {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalSessions,
        COUNT(DISTINCT userId) as uniqueUsers,
        AVG(durationSeconds) as avgDurationSeconds,
        SUM(eventCount) as totalEvents,
        AVG(eventCount) as avgEventsPerSession
      FROM analytics_sessions
      WHERE startedAt BETWEEN ? AND ?
    `).get(startDate, endDate);

    const dailyStats = db.prepare(`
      SELECT
        DATE(startedAt) as date,
        COUNT(*) as sessions,
        COUNT(DISTINCT userId) as uniqueUsers,
        AVG(durationSeconds) as avgDuration
      FROM analytics_sessions
      WHERE startedAt BETWEEN ? AND ?
      GROUP BY DATE(startedAt)
      ORDER BY date
    `).all(startDate, endDate);

    const platformStats = db.prepare(`
      SELECT platform, COUNT(*) as sessions, COUNT(DISTINCT userId) as uniqueUsers
      FROM analytics_sessions
      WHERE startedAt BETWEEN ? AND ?
      GROUP BY platform
    `).all(startDate, endDate);

    return { ...stats, daily: dailyStats, byPlatform: platformStats };
  }
}

module.exports = AnalyticsSession;
