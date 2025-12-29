import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const LOCAL_URL = 'http://localhost:3000/api';
const NETWORK_URL = 'http://192.168.40.16:3000/api'; // Your current IP 

const api = axios.create({
  baseURL: LOCAL_URL, // Default to localhost
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add dynamic URL switching
api.interceptors.request.use(async (config) => {
  // Try localhost first, fallback to network if needed
  try {
    await axios.get('http://localhost:3000/health');
    config.baseURL = LOCAL_URL;
  } catch {
    config.baseURL = NETWORK_URL;
  }
  return config;
});

export default api;