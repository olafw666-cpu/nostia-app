const db = require('../database/db');

class Event {
  static create(eventData) {
    const { title, description, location, eventDate, createdBy, type, latitude, longitude } = eventData;

    const stmt = db.prepare(`
      INSERT INTO events (title, description, location, eventDate, createdBy, type, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, description, location, eventDate, createdBy, type || 'social', latitude || null, longitude || null);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare(`
      SELECT e.*, u.username as creatorUsername, u.name as creatorName
      FROM events e
      INNER JOIN users u ON e.createdBy = u.id
      WHERE e.id = ?
    `);

    return stmt.get(id);
  }

  static getAll() {
    const stmt = db.prepare(`
      SELECT e.*, u.username as creatorUsername, u.name as creatorName
      FROM events e
      INNER JOIN users u ON e.createdBy = u.id
      ORDER BY e.eventDate DESC
    `);

    return stmt.all();
  }

  static getUserEvents(userId) {
    const stmt = db.prepare(`
      SELECT e.*, u.username as creatorUsername, u.name as creatorName
      FROM events e
      INNER JOIN users u ON e.createdBy = u.id
      WHERE e.createdBy = ?
      ORDER BY e.eventDate DESC
    `);

    return stmt.all(userId);
  }

  static getUpcoming(limit = 10) {
    const stmt = db.prepare(`
      SELECT e.*, u.username as creatorUsername, u.name as creatorName
      FROM events e
      INNER JOIN users u ON e.createdBy = u.id
      WHERE e.eventDate >= datetime('now')
      ORDER BY e.eventDate ASC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  static update(id, updates) {
    const allowedFields = ['title', 'description', 'location', 'eventDate', 'type', 'latitude', 'longitude'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);

    const stmt = db.prepare(`
      UPDATE events SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `);

    stmt.run(...values, id);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    return stmt.run(id);
  }

  /**
   * Get nearby events using Haversine formula
   * @param {number} lat - User's latitude
   * @param {number} lng - User's longitude
   * @param {number} radiusKm - Search radius in kilometers (default 50km)
   * @param {number} limit - Maximum number of results
   * @returns {Array} Events sorted by distance
   */
  static getNearby(lat, lng, radiusKm = 50, limit = 20) {
    // Using Haversine formula to calculate distance
    // SQLite doesn't have built-in geo functions, so we calculate distance in the query
    const stmt = db.prepare(`
      SELECT e.*, u.username as creatorUsername, u.name as creatorName,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(e.latitude)) *
            cos(radians(e.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(e.latitude))
          )
        ) AS distance
      FROM events e
      INNER JOIN users u ON e.createdBy = u.id
      WHERE e.latitude IS NOT NULL
        AND e.longitude IS NOT NULL
        AND e.eventDate >= datetime('now')
      HAVING distance <= ?
      ORDER BY distance ASC
      LIMIT ?
    `);

    // SQLite doesn't have radians() function, so we need a workaround
    // Let's use a simpler approach with pre-calculated values
    return this.getNearbySimple(lat, lng, radiusKm, limit);
  }

  /**
   * Simplified nearby events query (approximation)
   * Uses bounding box + simple distance filter
   */
  static getNearbySimple(lat, lng, radiusKm = 50, limit = 20) {
    // Approximate: 1 degree latitude = 111km, 1 degree longitude varies by latitude
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    const stmt = db.prepare(`
      SELECT e.*, u.username as creatorUsername, u.name as creatorName
      FROM events e
      INNER JOIN users u ON e.createdBy = u.id
      WHERE e.latitude IS NOT NULL
        AND e.longitude IS NOT NULL
        AND e.latitude BETWEEN ? AND ?
        AND e.longitude BETWEEN ? AND ?
        AND e.eventDate >= datetime('now')
      ORDER BY e.eventDate ASC
      LIMIT ?
    `);

    const events = stmt.all(minLat, maxLat, minLng, maxLng, limit);

    // Calculate and attach actual distance to each event
    return events.map(event => ({
      ...event,
      distance: this.calculateDistance(lat, lng, event.latitude, event.longitude)
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @returns {number} Distance in kilometers
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get events by type
   */
  static getByType(type, limit = 20) {
    const stmt = db.prepare(`
      SELECT e.*, u.username as creatorUsername, u.name as creatorName
      FROM events e
      INNER JOIN users u ON e.createdBy = u.id
      WHERE e.type = ?
        AND e.eventDate >= datetime('now')
      ORDER BY e.eventDate ASC
      LIMIT ?
    `);

    return stmt.all(type, limit);
  }
}

module.exports = Event;
