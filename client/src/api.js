// Use HTTPS in production, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Set auth token to localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove auth token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Get current user from localStorage
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Set current user to localStorage
const setCurrentUser = (user) => localStorage.setItem('user', JSON.stringify(user));

// Remove current user from localStorage
const removeCurrentUser = () => localStorage.removeItem('user');

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    // Handle rate limiting
    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    // Detect consent-required response and notify the app
    if (response.status === 403 && error.consentRequired) {
      window.dispatchEvent(new CustomEvent('consent-required', { detail: error }));
    }
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  register: async (username, password, name, email, locationConsent = true, dataCollectionConsent = true) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, email, locationConsent, dataCollectionConsent }),
    });
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  logout: () => {
    removeToken();
    removeCurrentUser();
  },

  getMe: () => apiRequest('/users/me'),

  updateMe: (updates) => apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
};

// Friends API
export const friendsAPI = {
  getAll: () => apiRequest('/friends'),
  getRequests: () => apiRequest('/friends/requests'),
  sendRequest: (friendId) => apiRequest('/friends/request', {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  }),
  acceptRequest: (requestId) => apiRequest(`/friends/accept/${requestId}`, {
    method: 'POST',
  }),
  rejectRequest: (requestId) => apiRequest(`/friends/reject/${requestId}`, {
    method: 'DELETE',
  }),
  removeFriend: (friendId) => apiRequest(`/friends/${friendId}`, {
    method: 'DELETE',
  }),
  searchUsers: (query) => apiRequest(`/users/search?query=${encodeURIComponent(query)}`),
};

// Trips API
export const tripsAPI = {
  getAll: () => apiRequest('/trips'),
  getById: (id) => apiRequest(`/trips/${id}`),
  create: (tripData) => apiRequest('/trips', {
    method: 'POST',
    body: JSON.stringify(tripData),
  }),
  update: (id, updates) => apiRequest(`/trips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  delete: (id) => apiRequest(`/trips/${id}`, {
    method: 'DELETE',
  }),
  addParticipant: (tripId, userId) => apiRequest(`/trips/${tripId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
  removeParticipant: (tripId, userId) => apiRequest(`/trips/${tripId}/participants/${userId}`, {
    method: 'DELETE',
  }),
  // Vault leader management
  transferVaultLeader: (tripId, newLeaderId) => apiRequest(`/trips/${tripId}/vault-leader`, {
    method: 'POST',
    body: JSON.stringify({ newLeaderId }),
  }),
  // Trip invitations
  inviteUser: (tripId, userId) => apiRequest(`/trips/${tripId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
  getInvitations: () => apiRequest('/trips/invitations'),
  respondToInvitation: (invitationId, accept) => apiRequest(`/trips/invitations/${invitationId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  }),
};

// Events API
export const eventsAPI = {
  getAll: () => apiRequest('/events'),
  getUpcoming: (limit = 10) => apiRequest(`/events/upcoming?limit=${limit}`),
  getNearby: (lat, lng, radius = 50) => apiRequest(`/events/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getById: (id) => apiRequest(`/events/${id}`),
  create: (eventData) => apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  }),
  update: (id, updates) => apiRequest(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  delete: (id) => apiRequest(`/events/${id}`, {
    method: 'DELETE',
  }),
};

// Vault API
export const vaultAPI = {
  getTripSummary: (tripId) => apiRequest(`/vault/trip/${tripId}`),
  createEntry: (entryData) => apiRequest('/vault', {
    method: 'POST',
    body: JSON.stringify(entryData),
  }),
  markSplitPaid: (splitId) => apiRequest(`/vault/splits/${splitId}/paid`, {
    method: 'PUT',
  }),
  deleteEntry: (id) => apiRequest(`/vault/${id}`, {
    method: 'DELETE',
  }),
};

// Feed API
export const feedAPI = {
  getUserFeed: (limit = 50) => apiRequest(`/feed?limit=${limit}`),
  getPublicFeed: (limit = 50) => apiRequest(`/feed/public?limit=${limit}`),
  createPost: (postData) => apiRequest('/feed', {
    method: 'POST',
    body: JSON.stringify(postData),
  }),
  deletePost: (id) => apiRequest(`/feed/${id}`, {
    method: 'DELETE',
  }),
  likePost: (postId) => apiRequest(`/feed/${postId}/like`, {
    method: 'POST',
  }),
  unlikePost: (postId) => apiRequest(`/feed/${postId}/like`, {
    method: 'DELETE',
  }),
  getComments: (postId) => apiRequest(`/feed/${postId}/comments`),
  addComment: (postId, content) => apiRequest(`/feed/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),
  getUnreadCount: () => apiRequest('/notifications/unread-count'),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllAsRead: () => apiRequest('/notifications/read-all', {
    method: 'PUT',
  }),
};

// Messages API
export const messagesAPI = {
  getConversations: () => apiRequest('/conversations'),
  getOrCreateConversation: (friendId) => apiRequest('/conversations', {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  }),
  getMessages: (conversationId, limit = 50) => apiRequest(`/conversations/${conversationId}/messages?limit=${limit}`),
  sendMessage: (conversationId, content) => apiRequest(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
  markAsRead: (conversationId) => apiRequest(`/conversations/${conversationId}/read`, {
    method: 'PUT',
  }),
  getUnreadCount: () => apiRequest('/conversations/unread-count'),
};

// Adventures API
export const adventuresAPI = {
  getAll: () => apiRequest('/adventures'),
  search: (query) => apiRequest(`/adventures?search=${encodeURIComponent(query)}`),
  getByCategory: (category) => apiRequest(`/adventures?category=${category}`),
  getByDifficulty: (difficulty) => apiRequest(`/adventures?difficulty=${difficulty}`),
  getById: (id) => apiRequest(`/adventures/${id}`),
  create: (adventureData) => apiRequest('/adventures', {
    method: 'POST',
    body: JSON.stringify(adventureData),
  }),
};

// AI API
export const aiAPI = {
  generate: (task, input) => apiRequest('/ai/generate', {
    method: 'POST',
    body: JSON.stringify({ task, input }),
  }),
  chat: (message, context = {}) => apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  }),
};

// Payments API (Stripe)
export const paymentsAPI = {
  createIntent: (vaultSplitId) => apiRequest('/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({ vaultSplitId }),
  }),
  confirmPayment: (paymentIntentId) => apiRequest('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId }),
  }),
  getTransactionHistory: (tripId) => apiRequest(`/payments/trip/${tripId}/history`),
  getUnpaidSplits: () => apiRequest('/payments/unpaid-splits'),
  getPaymentMethods: () => apiRequest('/payment-methods'),
  setDefaultPaymentMethod: (methodId) => apiRequest(`/payment-methods/${methodId}/default`, {
    method: 'PUT',
  }),
  deletePaymentMethod: (methodId) => apiRequest(`/payment-methods/${methodId}`, {
    method: 'DELETE',
  }),
};

// Consent API
export const consentAPI = {
  grant: (consentData) => apiRequest('/consent', {
    method: 'POST',
    body: JSON.stringify(consentData),
  }),
  getStatus: () => apiRequest('/consent'),
  revoke: () => apiRequest('/consent/revoke', { method: 'POST' }),
  getHistory: () => apiRequest('/consent/history'),
  getCurrentVersion: () => apiRequest('/consent/current-version'),
};

// Analytics API
export const analyticsAPI = {
  track: (eventData) => apiRequest('/analytics/track', {
    method: 'POST',
    body: JSON.stringify(eventData),
  }).catch(() => {}), // Fire-and-forget
  trackBatch: (events) => apiRequest('/analytics/track-batch', {
    method: 'POST',
    body: JSON.stringify({ events }),
  }).catch(() => {}),
  startSession: (sessionData) => apiRequest('/analytics/session/start', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  }).catch(() => {}),
  endSession: (sessionId) => apiRequest('/analytics/session/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  }).catch(() => {}),
  getDashboard: (params = {}) => apiRequest(`/analytics/dashboard?${new URLSearchParams(params)}`),
  getHeatmap: (params = {}) => apiRequest(`/analytics/heatmap?${new URLSearchParams(params)}`),
  getFeatureUsage: (params = {}) => apiRequest(`/analytics/feature-usage?${new URLSearchParams(params)}`),
  getRetention: (params = {}) => apiRequest(`/analytics/retention?${new URLSearchParams(params)}`),
  getFunnels: (params = {}) => apiRequest(`/analytics/funnels?${new URLSearchParams(params)}`),
  getSessions: (params = {}) => apiRequest(`/analytics/sessions?${new URLSearchParams(params)}`),
  getRegional: (params = {}) => apiRequest(`/analytics/regional?${new URLSearchParams(params)}`),
  subscribe: (plan) => apiRequest('/analytics/subscribe', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  }),
  getSubscription: () => apiRequest('/analytics/subscription'),
  cancelSubscription: () => apiRequest('/analytics/subscription/cancel', { method: 'POST' }),
  purchaseReport: (reportParams) => apiRequest('/analytics/reports/purchase', {
    method: 'POST',
    body: JSON.stringify(reportParams),
  }),
  downloadReport: (reportId) => apiRequest(`/analytics/reports/download/${reportId}`),
};

// Privacy API
export const privacyAPI = {
  getPolicy: () => apiRequest('/privacy/policy'),
  requestDataExport: () => apiRequest('/privacy/data-request', { method: 'POST' }),
  requestDataDeletion: () => apiRequest('/privacy/delete-data', { method: 'POST' }),
  downloadExport: (requestId) => apiRequest(`/privacy/data-export/${requestId}`),
};

// Export utilities
export { getToken, setToken, removeToken, getCurrentUser, setCurrentUser, removeCurrentUser };
