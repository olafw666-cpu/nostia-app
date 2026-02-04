const db = require('../database/db');

class AnalyticsEvent {
  static track(eventData) {
    const AnalyticsService = require('../services/analyticsService');
    const {
      userId,
      sessionId,
      eventType,
      eventName,
      eventData: extraData,
      latitude,
      longitude,
      duration
    } = eventData;

    // Compute region bucket from GPS coordinates
    const regionBucket = (latitude && longitude)
      ? AnalyticsService.bucketRegion(latitude, longitude)
      : null;

    const stmt = db.prepare(`
      INSERT INTO analytics_events (userId, sessionId, eventType, eventName, eventData, latitude, longitude, regionBucket, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId || null,
      sessionId,
      eventType,
      eventName,
      extraData ? JSON.stringify(extraData) : null,
      latitude || null,
      longitude || null,
      regionBucket,
      duration || null
    );

    // Increment session event count
    if (sessionId) {
      try {
        db.prepare(`
          UPDATE analytics_sessions SET eventCount = eventCount + 1 WHERE sessionId = ?
        `).run(sessionId);
      } catch (e) {
        // Session may not exist yet
      }
    }

    return { id: result.lastInsertRowid, regionBucket };
  }

  static trackBatch(events) {
    const results = [];
    const trackTransaction = db.transaction((evts) => {
      for (const evt of evts) {
        results.push(this.track(evt));
      }
    });
    trackTransaction(events);
    return results;
  }

  static getByUser(userId, limit = 100) {
    return db.prepare(`
      SELECT * FROM analytics_events WHERE userId = ? ORDER BY createdAt DESC LIMIT ?
    `).all(userId, limit);
  }

  static getByRegion(regionBucket, startDate, endDate) {
    return db.prepare(`
      SELECT * FROM analytics_events
      WHERE regionBucket = ? AND createdAt BETWEEN ? AND ?
      ORDER BY createdAt DESC
    `).all(regionBucket, startDate, endDate);
  }

  static getByType(eventType, startDate, endDate, limit = 1000) {
    return db.prepare(`
      SELECT * FROM analytics_events
      WHERE eventType = ? AND createdAt BETWEEN ? AND ?
      ORDER BY createdAt DESC LIMIT ?
    `).all(eventType, startDate, endDate, limit);
  }

  static getCountByRegion(startDate, endDate, minGroupSize = 5) {
    return db.prepare(`
      SELECT regionBucket, COUNT(*) as eventCount, COUNT(DISTINCT userId) as uniqueUsers
      FROM analytics_events
      WHERE regionBucket IS NOT NULL AND createdAt BETWEEN ? AND ?
      GROUP BY regionBucket
      HAVING COUNT(DISTINCT userId) >= ?
      ORDER BY eventCount DESC
    `).all(startDate, endDate, minGroupSize);
  }

  static getCountByEventName(startDate, endDate) {
    return db.prepare(`
      SELECT eventName, COUNT(*) as count, COUNT(DISTINCT userId) as uniqueUsers
      FROM analytics_events
      WHERE createdAt BETWEEN ? AND ?
      GROUP BY eventName
      ORDER BY count DESC
    `).all(startDate, endDate);
  }

  static getDailyEventCounts(startDate, endDate) {
    return db.prepare(`
      SELECT DATE(createdAt) as date, COUNT(*) as eventCount, COUNT(DISTINCT userId) as uniqueUsers
      FROM analytics_events
      WHERE createdAt BETWEEN ? AND ?
      GROUP BY DATE(createdAt)
      ORDER BY date
    `).all(startDate, endDate);
  }

  static purgeOldRawData(retentionDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoff = cutoffDate.toISOString();

    // Nullify user IDs and exact GPS on old events (keep regionBucket)
    db.prepare(`
      UPDATE analytics_events
      SET userId = NULL, latitude = NULL, longitude = NULL
      WHERE createdAt < ? AND userId IS NOT NULL
    `).run(cutoff);

    // Delete very old events (double the retention period)
    const deleteCutoff = new Date();
    deleteCutoff.setDate(deleteCutoff.getDate() - (retentionDays * 2));
    const result = db.prepare(`
      DELETE FROM analytics_events WHERE createdAt < ?
    `).run(deleteCutoff.toISOString());

    return { anonymized: cutoff, deleted: result.changes };
  }
}

module.exports = AnalyticsEvent;
