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
      title: 'ðŸŽ’ Trip Planning',
      description: 'Organize group adventures',
      screen: 'TripPlanning',
      color: '#FF6B6B',
    },
    {
      title: 'ðŸ“ Event Discovery',
      description: 'Find nearby adventures',
      screen: 'Events',
      color: '#4ECDC4',
    },
    {
      title: 'ðŸ“± Social Feed',
      description: 'Share your adventures',
      screen: 'Feed',
      color: '#45B7D1',
    },
    {
      title: 'ðŸ‘¥ Friends',
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
