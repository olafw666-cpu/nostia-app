import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import TripsScreen from '../screens/TripsScreen';
import AdventuresScreen from '../screens/AdventuresScreen';
import FriendsScreen from '../screens/FriendsScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TripsTab') {
            iconName = focused ? 'airplane' : 'airplane-outline';
          } else if (route.name === 'DiscoverTab') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'FriendsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else {
            iconName = 'help-outline';
          }

          // Animated icon with scale and opacity transitions
          const scale = new Animated.Value(focused ? 1.1 : 1);
          const opacity = new Animated.Value(focused ? 1 : 0.6);

          return (
            <Animated.View style={{ transform: [{ scale }], opacity }}>
              <Ionicons name={iconName} size={size} color={color} />
            </Animated.View>
          );
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', headerTitle: 'Nostia' }}
      />
      <Tab.Screen
        name="TripsTab"
        component={TripsScreen}
        options={{ title: 'Trips', headerTitle: 'My Trips' }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={AdventuresScreen}
        options={{ title: 'Discover', headerTitle: 'Discover Adventures' }}
      />
      <Tab.Screen
        name="FriendsTab"
        component={FriendsScreen}
        options={{ title: 'Friends', headerTitle: 'My Friends' }}
      />
    </Tab.Navigator>
  );
}
