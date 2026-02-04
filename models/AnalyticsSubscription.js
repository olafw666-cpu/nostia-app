const db = require('../database/db');

class AnalyticsSubscription {
  static create(userId, plan, stripeSubscriptionId) {
    // Set expiry based on plan (30 days for basic, 90 for pro, 365 for enterprise)
    const daysMap = { basic: 30, pro: 90, enterprise: 365 };
    const days = daysMap[plan] || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const stmt = db.prepare(`
      INSERT INTO analytics_subscriptions (userId, plan, stripeSubscriptionId, status, expiresAt)
      VALUES (?, ?, ?, 'active', ?)
    `);

    const result = stmt.run(userId, plan, stripeSubscriptionId || null, expiresAt);
    return this.getById(result.lastInsertRowid);
  }

  static getById(id) {
    return db.prepare('SELECT * FROM analytics_subscriptions WHERE id = ?').get(id);
  }

  static getByUser(userId) {
    return db.prepare(`
      SELECT * FROM analytics_subscriptions
      WHERE userId = ? AND status = 'active'
      ORDER BY createdAt DESC
      LIMIT 1
    `).get(userId);
  }

  static hasAccess(userId) {
    const sub = this.getByUser(userId);
    if (!sub) return false;
    if (sub.status !== 'active') return false;
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      // Auto-expire
      this.cancel(userId);
      return false;
    }
    return true;
  }

  static cancel(userId) {
    db.prepare(`
      UPDATE analytics_subscriptions SET status = 'canceled' WHERE userId = ? AND status = 'active'
    `).run(userId);
    return { canceled: true };
  }

  static updateStatus(stripeSubscriptionId, status) {
    db.prepare(`
      UPDATE analytics_subscriptions SET status = ? WHERE stripeSubscriptionId = ?
    `).run(status, stripeSubscriptionId);
  }
}

module.exports = AnalyticsSubscription;
