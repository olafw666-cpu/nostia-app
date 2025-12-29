# Nostia Mobile React Native Setup Script
# Run this in VS Code PowerShell terminal

Write-Host "🚀 Setting up Nostia Mobile React Native Project..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first:" -ForegroundColor Red
    Write-Host "   https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Install Expo CLI globally if not already installed
Write-Host "`n📦 Installing Expo CLI..." -ForegroundColor Yellow
try {
    $expoCheck = expo --version
    Write-Host "✅ Expo CLI already installed: $expoCheck" -ForegroundColor Green
} catch {
    Write-Host "Installing Expo CLI globally..." -ForegroundColor Yellow
    npm install -g expo-cli
}

# Create new Expo project
Write-Host "`n📁 Creating new Expo project..." -ForegroundColor Yellow
$projectName = "nostia-mobile"
$projectPath = "."

# Check if directory already exists
if (Test-Path $projectName) {
    Write-Host "⚠️  Directory '$projectName' already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -eq 'y' -or $overwrite -eq 'Y') {
        Remove-Item -Path $projectName -Recurse -Force
    } else {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

# Create Expo project
Write-Host "Creating Expo project: $projectName" -ForegroundColor Yellow
npx create-expo-app $projectName --template blank-typescript

# Navigate to project directory
Set-Location $projectName

# Install required dependencies
Write-Host "`n📦 Installing React Native dependencies..." -ForegroundColor Yellow
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler

# Install Expo specific packages
Write-Host "📦 Installing Expo packages..." -ForegroundColor Yellow
npx expo install expo-location expo-secure-store expo-camera expo-image-picker
npx expo install expo-linear-gradient

# Install additional utilities
Write-Host "📦 Installing utility packages..." -ForegroundColor Yellow
npm install axios
npm install @react-native-async-storage/async-storage

# Create directory structure
Write-Host "`n📁 Creating project structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src" -Force
New-Item -ItemType Directory -Path "src/screens" -Force
New-Item -ItemType Directory -Path "src/components" -Force
New-Item -ItemType Directory -Path "src/services" -Force
New-Item -ItemType Directory -Path "src/utils" -Force
New-Item -ItemType Directory -Path "src/types" -Force

# Create basic configuration files
Write-Host "⚙️  Creating configuration files..." -ForegroundColor Yellow

# App.tsx
$appContent = @'
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Nostia' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
'@

$appContent | Out-File -FilePath "App.tsx" -Encoding UTF8

# Create services/api.ts
$apiContent = @'
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:3000/api'; // Update with your backend URL

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

export default api;
'@

$apiContent | Out-File -FilePath "src/services/api.ts" -Encoding UTF8

# Create types/user.ts
$typesContent = @'
export interface User {
  _id: string;
  name: string;
  username: string;
  email?: string;
  homeStatus?: 'open' | 'closed';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}
'@

$typesContent | Out-File -FilePath "src/types/user.ts" -Encoding UTF8

Write-Host "✅ Project structure created!" -ForegroundColor Green

# Create LoginScreen
Write-Host "📝 Creating LoginScreen..." -ForegroundColor Yellow
$loginScreenContent = @'
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { token } = response.data;
      
      // Store token securely
      await SecureStore.setItemAsync('jwt_token', token);
      
      // Navigate to home screen
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Welcome to Nostia</Text>
        <Text style={styles.subtitle}>Connect with fellow adventurers</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#007AFF',
    fontSize: 14,
  },
});
'@

$loginScreenContent | Out-File -FilePath "src/screens/LoginScreen.tsx" -Encoding UTF8

# Create HomeScreen
Write-Host "📝 Creating HomeScreen..." -ForegroundColor Yellow
$homeScreenContent = @'
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  const features = [
    {
      title: '🎒 Trip Planning',
      description: 'Organize group adventures',
      screen: 'TripPlanning',
      color: '#FF6B6B',
    },
    {
      title: '📍 Event Discovery',
      description: 'Find nearby adventures',
      screen: 'Events',
      color: '#4ECDC4',
    },
    {
      title: '📱 Social Feed',
      description: 'Share your adventures',
      screen: 'Feed',
      color: '#45B7D1',
    },
    {
      title: '👥 Friends',
      description: 'Connect with adventurers',
      screen: 'Friends',
      color: '#96CEB4',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Ready for Adventure?</Text>
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.featureCard, { backgroundColor: feature.color }]}
              onPress={() => navigation.navigate(feature.screen)}
            >
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 30,
    color: '#333',
  },
  featuresContainer: {
    gap: 15,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
'@

$homeScreenContent | Out-File -FilePath "src/screens/HomeScreen.tsx" -Encoding UTF8

# Create placeholder SignupScreen
Write-Host "📝 Creating SignupScreen..." -ForegroundColor Yellow
$signupContent = @'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sign Up Screen - Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
'@

$signupContent | Out-File -FilePath "src/screens/SignupScreen.tsx" -Encoding UTF8

# Update package.json scripts
Write-Host "⚙️  Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts | Add-Member -NotePropertyName "ios-device" -NotePropertyValue "expo run:ios --device" -Force
$packageJson.scripts | Add-Member -NotePropertyName "android-device" -NotePropertyValue "expo run:android --device" -Force
$packageJson | ConvertTo-Json -Depth 10 | Out-File "package.json" -Encoding UTF8

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green

Write-Host "`n📱 Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the development server:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan

Write-Host "`n2. Run on iOS simulator:" -ForegroundColor White
Write-Host "   npm run ios" -ForegroundColor Cyan

Write-Host "`n3. Run on Android emulator:" -ForegroundColor White
Write-Host "   npm run android" -ForegroundColor Cyan

Write-Host "`n4. Scan QR code with Expo Go app on your phone" -ForegroundColor White

Write-Host "`n⚠️  Important:" -ForegroundColor Yellow
Write-Host "- Make sure your backend API is running on http://localhost:3000" -ForegroundColor White
Write-Host "- Update API_BASE_URL in src/services/api.ts if needed" -ForegroundColor White
Write-Host "- Install Expo Go app on your phone for testing" -ForegroundColor White

Write-Host "`n📖 Helpful commands:" -ForegroundColor Yellow
Write-Host "- expo run:ios          # Run on iOS simulator" -ForegroundColor White
Write-Host "- expo run:android      # Run on Android emulator" -ForegroundColor White
Write-Host "- expo start --tunnel   # Start with tunnel for device testing" -ForegroundColor White

Write-Host "`n🎉 Happy coding!" -ForegroundColor Green