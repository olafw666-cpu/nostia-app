const db = require('../database/db');

class Consent {
  static create(userId, consentData) {
    const {
      consentVersion,
      locationConsent,
      dataCollectionConsent,
      privacyPolicyVersion,
      ipAddress,
      userAgent
    } = consentData;

    // Revoke any existing active consent first
    db.prepare(`
      UPDATE user_consents SET revokedAt = CURRENT_TIMESTAMP
      WHERE userId = ? AND revokedAt IS NULL
    `).run(userId);

    // Insert new consent record
    const stmt = db.prepare(`
      INSERT INTO user_consents (userId, consentVersion, locationConsent, dataCollectionConsent, privacyPolicyVersion, ipAddress, userAgent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      consentVersion,
      locationConsent ? 1 : 0,
      dataCollectionConsent ? 1 : 0,
      privacyPolicyVersion,
      ipAddress || null,
      userAgent || null
    );

    // Update user record
    db.prepare(`
      UPDATE users SET consentVersion = ?, locationConsentGranted = ? WHERE id = ?
    `).run(consentVersion, locationConsent ? 1 : 0, userId);

    return this.getById(result.lastInsertRowid);
  }

  static getById(id) {
    return db.prepare('SELECT * FROM user_consents WHERE id = ?').get(id);
  }

  static getCurrentConsent(userId) {
    return db.prepare(`
      SELECT * FROM user_consents
      WHERE userId = ? AND revokedAt IS NULL
      ORDER BY grantedAt DESC
      LIMIT 1
    `).get(userId);
  }

  static revoke(userId) {
    db.prepare(`
      UPDATE user_consents SET revokedAt = CURRENT_TIMESTAMP
      WHERE userId = ? AND revokedAt IS NULL
    `).run(userId);

    db.prepare(`
      UPDATE users SET locationConsentGranted = 0, consentVersion = NULL WHERE id = ?
    `).run(userId);

    return { revoked: true };
  }

  static hasValidConsent(userId) {
    const ConsentService = require('../services/consentService');
    const currentVersion = ConsentService.getCurrentConsentVersion();
    const consent = this.getCurrentConsent(userId);

    if (!consent) return false;
    if (consent.consentVersion !== currentVersion) return false;
    if (!consent.locationConsent) return false;

    return true;
  }

  static getConsentHistory(userId) {
    return db.prepare(`
      SELECT * FROM user_consents
      WHERE userId = ?
      ORDER BY grantedAt DESC
    `).all(userId);
  }
}

module.exports = Consent;
