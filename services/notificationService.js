const db = require('../database/db');
const fetch = require('node-fetch');

class NotificationService {
  /**
   * Save or update push token for a user
   */
  static savePushToken(userId, token, platform = 'expo') {
    const stmt = db.prepare(`
      INSERT INTO push_tokens (userId, token, platform, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        token = excluded.token,
        platform = excluded.platform,
        updatedAt = CURRENT_TIMESTAMP
    `);
    return stmt.run(userId, token, platform);
  }

  /**
   * Get push token for a user
   */
  static getPushToken(userId) {
    return db.prepare('SELECT * FROM push_tokens WHERE userId = ?').get(userId);
  }

  /**
   * Remove push token for a user
   */
  static removePushToken(userId) {
    return db.prepare('DELETE FROM push_tokens WHERE userId = ?').run(userId);
  }

  /**
   * Save notification to database
   */
  static saveNotification(userId, type, title, body, data = null) {
    const stmt = db.prepare(`
      INSERT INTO notifications (userId, type, title, body, data)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, type, title, body, data ? JSON.stringify(data) : null);
    return this.getNotificationById(result.lastInsertRowid);
  }

  /**
   * Get notification by ID
   */
  static getNotificationById(id) {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    if (notification && notification.data) {
      notification.data = JSON.parse(notification.data);
    }
    return notification;
  }

  /**
   * Get all notifications for a user
   */
  static getUserNotifications(userId, limit = 50) {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).all(userId, limit);

    return notifications.map(n => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null
    }));
  }

  /**
   * Get unread notification count for a user
   */
  static getUnreadCount(userId) {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0').get(userId);
    return result.count;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId, userId) {
    return db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?').run(notificationId, userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  static markAllAsRead(userId) {
    return db.prepare('UPDATE notifications SET read = 1 WHERE userId = ? AND read = 0').run(userId);
  }

  /**
   * Send push notification using Expo Push API
   */
  static async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Save to database first
      this.saveNotification(userId, data.type || 'general', title, body, data);

      // Get user's push token
      const tokenRecord = this.getPushToken(userId);
      if (!tokenRecord || !tokenRecord.token) {
        console.log(`No push token found for user ${userId}`);
        return { success: false, reason: 'no_token' };
      }

      const token = tokenRecord.token;

      // Check if it's a valid Expo push token
      if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
        console.log(`Invalid Expo push token format for user ${userId}`);
        return { success: false, reason: 'invalid_token' };
      }

      // Send via Expo Push API
      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log(`Push notification sent to user ${userId}:`, result);

      return { success: true, result };
    } catch (error) {
      console.error(`Error sending push notification to user ${userId}:`, error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Send notification for trip invitation
   */
  static async sendTripInviteNotification(invitedUserId, inviterName, tripTitle, tripId) {
    return this.sendPushNotification(
      invitedUserId,
      'Trip Invitation',
      `${inviterName} invited you to join "${tripTitle}"`,
      { type: 'trip_invite', tripId }
    );
  }

  /**
   * Send notification for friend request
   */
  static async sendFriendRequestNotification(targetUserId, requesterName, requestId) {
    return this.sendPushNotification(
      targetUserId,
      'Friend Request',
      `${requesterName} wants to be your friend`,
      { type: 'friend_request', requestId }
    );
  }

  /**
   * Send notification for payment received
   */
  static async sendPaymentReceivedNotification(recipientUserId, payerName, amount, tripTitle) {
    return this.sendPushNotification(
      recipientUserId,
      'Payment Received',
      `${payerName} paid you $${amount.toFixed(2)} for "${tripTitle}"`,
      { type: 'payment_received', amount, tripTitle }
    );
  }

  /**
   * Send notification for new message
   */
  static async sendMessageNotification(recipientUserId, senderName, messagePreview, conversationId) {
    return this.sendPushNotification(
      recipientUserId,
      `Message from ${senderName}`,
      messagePreview.length > 50 ? messagePreview.substring(0, 47) + '...' : messagePreview,
      { type: 'message', conversationId, senderName }
    );
  }
}

module.exports = NotificationService;
