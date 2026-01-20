const db = require('../database/db');

class Event {
  static create(eventData) {
    const { title, description, location, eventDate, createdBy, type } = eventData;

    const stmt = db.prepare(`
      INSERT INTO events (title, description, location, eventDate, createdBy, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, description, location, eventDate, createdBy, type || 'social');
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
    const allowedFields = ['title', 'description', 'location', 'eventDate', 'type'];
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
}

module.exports = Event;
