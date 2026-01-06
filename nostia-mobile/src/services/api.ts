import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your actual IP address
const API_BASE_URL = 'http://192.168.40.16:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic backend detection (tries multiple IPs)
const getWorkingBackend = async () => {
  const endpoints = [
    'http://192.168.40.16:3000/api',     // Your actual IP
    'http://localhost:3000/api',         // Local development
  ];
  
  for (const baseUrl of endpoints) {
    try {
      const response = await axios.get(`${baseUrl}/health`);
      return baseUrl; // Return working URL
    } catch (e) {
      console.log(`Tried ${baseUrl}: failed`);
    }
  }
  return 'http://192.168.40.16:3000/api'; // Fallback to your IP
};

// Add JWT token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
