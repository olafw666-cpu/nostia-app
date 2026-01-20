const API_URL = 'http://localhost:3000/api';

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

  register: async (username, password, name, email) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, email }),
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

// Export utilities
export { getToken, setToken, removeToken, getCurrentUser, setCurrentUser, removeCurrentUser };
