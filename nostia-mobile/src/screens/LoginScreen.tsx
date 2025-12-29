import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [backendStatus, setBackendStatus] = useState(' Checking backend...');
  const navigation = useNavigation();  //  Fixed - added () and removed '

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
  try {
    // Test multiple backend endpoints
    const endpoints = [
      'http://localhost:3000/api/health',
      'http://192.168.40.16:3000/api/health',
      'http://localhost:3000/api',
      'http://192.168.40.16:3000/api'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint.replace('/api/health', '').replace('/api', ''));
        setBackendStatus(`✅ Connected: ${endpoint.includes('localhost') ? 'Local' : 'Network'}`);
        return;
      } catch (e) {
        console.log(`Tried ${endpoint}: ${e.message}`);
      }
    }
    
    // If no endpoints work, try simple connection test
    const baseUrl = api.defaults.baseURL || 'http://localhost:3000/api';
    await api.get('/health');
    setBackendStatus('✅ Backend Connected!');
  } catch (error) {
    setBackendStatus('❌ Backend Error');
    console.log('Backend connection failed:', error.message);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}> Nostia Login</Text>
      <Text style={styles.status}>{backendStatus}</Text>
      <Text style={styles.text}>Welcome back, adventurer!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    fontSize: 14,
    marginBottom: 5,
    color: '#28a745',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});
