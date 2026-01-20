import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Set to localhost - user must update to their local IP for physical device testing
const API_BASE_URL = 'http://10.174.176.162:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Authentication API =====
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      await SecureStore.setItemAsync('jwt_token', response.data.token);
    }
    return response.data;
  },

  register: async (username: string, password: string, name: string, email?: string) => {
    const response = await api.post('/auth/register', { username, password, name, email });
    if (response.data.token) {
      await SecureStore.setItemAsync('jwt_token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
  },

  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (updates: any) => {
    const response = await api.put('/users/me', updates);
    return response.data;
  },
};

// ===== Trips API =====
export const tripsAPI = {
  getAll: async () => {
    const response = await api.get('/trips');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  create: async (tripData: any) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await api.put(`/trips/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },

  addParticipant: async (tripId: number, userId: number) => {
    const response = await api.post(`/trips/${tripId}/participants`, { userId });
    return response.data;
  },

  removeParticipant: async (tripId: number, userId: number) => {
    const response = await api.delete(`/trips/${tripId}/participants/${userId}`);
    return response.data;
  },
};

// ===== Friends API =====
export const friendsAPI = {
  getAll: async () => {
    const response = await api.get('/friends');
    return response.data;
  },

  getRequests: async () => {
    const response = await api.get('/friends/requests');
    return response.data;
  },

  sendRequest: async (friendId: number) => {
    const response = await api.post('/friends/request', { friendId });
    return response.data;
  },

  acceptRequest: async (requestId: number) => {
    const response = await api.post(`/friends/accept/${requestId}`);
    return response.data;
  },

  rejectRequest: async (requestId: number) => {
    const response = await api.delete(`/friends/reject/${requestId}`);
    return response.data;
  },

  removeFriend: async (friendId: number) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// ===== Vault API =====
export const vaultAPI = {
  getTripSummary: async (tripId: number) => {
    const response = await api.get(`/vault/trip/${tripId}`);
    return response.data;
  },

  createEntry: async (entryData: any) => {
    const response = await api.post('/vault', entryData);
    return response.data;
  },

  markSplitPaid: async (splitId: number) => {
    const response = await api.put(`/vault/splits/${splitId}/paid`);
    return response.data;
  },

  deleteEntry: async (id: number) => {
    const response = await api.delete(`/vault/${id}`);
    return response.data;
  },
};

// ===== Adventures API =====
export const adventuresAPI = {
  getAll: async () => {
    const response = await api.get('/adventures');
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get(`/adventures?search=${encodeURIComponent(query)}`);
    return response.data;
  },

  getByCategory: async (category: string) => {
    const response = await api.get(`/adventures?category=${category}`);
    return response.data;
  },

  getByDifficulty: async (difficulty: string) => {
    const response = await api.get(`/adventures?difficulty=${difficulty}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/adventures/${id}`);
    return response.data;
  },

  create: async (adventureData: any) => {
    const response = await api.post('/adventures', adventureData);
    return response.data;
  },
};

// ===== Feed API =====
export const feedAPI = {
  getUserFeed: async (limit: number = 50) => {
    const response = await api.get(`/feed?limit=${limit}`);
    return response.data;
  },

  getPublicFeed: async (limit: number = 50) => {
    const response = await api.get(`/feed/public?limit=${limit}`);
    return response.data;
  },

  createPost: async (postData: any) => {
    const response = await api.post('/feed', postData);
    return response.data;
  },

  deletePost: async (id: number) => {
    const response = await api.delete(`/feed/${id}`);
    return response.data;
  },
};

// Payments API (Stripe)
export const paymentsAPI = {
  createIntent: async (vaultSplitId: number) => {
    const response = await api.post('/payments/create-intent', { vaultSplitId });
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await api.post('/payments/confirm', { paymentIntentId });
    return response.data;
  },

  getTransactionHistory: async (tripId: number) => {
    const response = await api.get(`/payments/trip/${tripId}/history`);
    return response.data;
  },

  getUnpaidSplits: async () => {
    const response = await api.get('/payments/unpaid-splits');
    return response.data;
  },
};

// ===== Events API =====
export const eventsAPI = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getUpcoming: async (limit: number = 10) => {
    const response = await api.get(`/events/upcoming?limit=${limit}`);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (eventData: any) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  update: async (id: number, updates: any) => {
    const response = await api.put(`/events/${id}`, updates);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

// ===== AI API =====
export const aiAPI = {
  generate: async (task: string, input: any) => {
    const response = await api.post('/ai/generate', { task, input });
    return response.data;
  },
};

export default api;
