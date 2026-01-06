import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [backendStatus, setBackendStatus] = useState('🔄 Checking backend...');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Test backend connection on mount
  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const endpoints = [
        'http://192.168.40.16:3000/',           // Your actual IP
        'http://localhost:3000/',               // Local development
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          setBackendStatus('✅ Backend Connected!');
          return;
        } catch (e) {
          console.log(`Tried ${endpoint}: failed`);
        }
      }
      setBackendStatus('❌ Backend Error - Check if server is running');
    } catch (error) {
      setBackendStatus('❌ Backend Error');
      console.log('Backend connection failed:', error.message);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    console.log('Attempting login with:', { username: username.trim(), password });
    console.log('API base URL:', api.defaults.baseURL);

    if (backendStatus.includes('❌')) {
      Alert.alert('Error', 'Cannot login - backend not connected');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password: password,
      });

      console.log('Login success:', response.data);

      const { token, user } = response.data;
      
      // Store token securely
      await SecureStore.setItemAsync('jwt_token', token);
      
      Alert.alert(
        'Success!', 
        `Welcome back, ${user.name || username}!`,
        [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]
      );
      
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid username or password');
      } else if (error.response?.status === 404) {
        Alert.alert('Login Failed', 'User not found');
      } else {
        Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>🎒 Nostia Login</Text>
        <Text style={styles.status}>{backendStatus}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading || backendStatus.includes('❌')}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSignup} style={styles.linkButton}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#007AFF',
    fontSize: 14,
  },
});