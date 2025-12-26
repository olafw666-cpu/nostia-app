import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState({
    id: '1',
    name: 'Alex Rivera',
    username: 'alex_explorer',
    homeOpen: false,
    friends: ['user2', 'user3'],
  });

  const [trips, setTrips] = useState([
    { id: '1', name: 'Colorado Rockies', destination: 'Denver, CO', dateRange: 'Jun 15-22', participants: 3, vaultBalance: 850 },
    { id: '2', name: 'Beach Getaway', destination: 'Santa Cruz, CA', dateRange: 'Jul 10-14', participants: 5, vaultBalance: 1200 },
  ]);

  const [events, setEvents] = useState([
    { id: '1', title: 'Sunset Hike', host: 'Sarah M.', location: 'Horsetooth Rock', time: 'Today 6:00 PM', distance: '2.3 mi' },
    { id: '2', title: 'Coffee Meetup', host: 'Mike T.', location: 'Downtown FC', time: 'Tomorrow 10:00 AM', distance: '0.8 mi' },
  ]);

  const [adventurePosts, setAdventurePosts] = useState([
    { id: '1', author: 'Emma W.', location: 'Rocky Mountain NP', caption: 'Best trail of the year!', time: '2h ago', likes: 24 },
    { id: '2', author: 'Josh K.', location: 'Poudre Canyon', caption: 'Epic kayaking session', time: '5h ago', likes: 18 },
  ]);

  const toggleHomeStatus = () => {
    setUser(prev => ({ ...prev, homeOpen: !prev.homeOpen }));
  };

  const createTrip = () => {
    const newTrip = {
      id: String(trips.length + 1),
      name: 'New Adventure',
      destination: 'TBD',
      dateRange: 'Select dates',
      participants: 1,
      vaultBalance: 0,
    };
    setTrips([...trips, newTrip]);
  };

  // --- Views ---
  const HomeView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back, {user.name}!</Text>
        <Text>Your next adventure awaits</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Home Status</Text>
        <Button
          title={user.homeOpen ? '🏠 Open' : '🔒 Closed'}
          onPress={toggleHomeStatus}
        />
        <Text style={styles.smallText}>
          {user.homeOpen ? 'Friends can see you’re available to host' : 'Toggle to let friends know your home is open'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Upcoming Trips</Text>
        {trips.slice(0, 2).map(trip => (
          <View key={trip.id} style={styles.tripItem}>
            <Text style={styles.boldText}>{trip.name}</Text>
            <Text>{trip.dateRange}</Text>
            <Text>{trip.participants} people • ${trip.vaultBalance}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Nearby Events</Text>
        {events.map(event => (
          <View key={event.id} style={styles.eventItem}>
            <Text style={styles.boldText}>{event.title}</Text>
            <Text>by {event.host}</Text>
            <Text>📍 {event.location} • {event.distance}</Text>
            <Text>{event.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const TripsView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>My Trips</Text>
        <Button title="+" onPress={createTrip} />
      </View>

      {trips.map(trip => (
        <View key={trip.id} style={styles.card}>
          <Text style={styles.boldText}>{trip.name}</Text>
          <Text>{trip.destination}</Text>
          <Text>{trip.dateRange}</Text>
          <Text>{trip.participants} people • ${trip.vaultBalance}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const DiscoverView = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Discover</Text>

      <View style={[styles.card, { backgroundColor: '#f97316' }]}>
        <FontAwesome5 name="compass" size={32} color="white" />
        <Text style={styles.subtitle}>Find Adventurers</Text>
        <Text>Connect with people nearby looking for adventure</Text>
        <Button title="Start Matching" onPress={() => {}} />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Adventure Feed</Text>
        {adventurePosts.map(post => (
          <View key={post.id} style={styles.eventItem}>
            <Text style={styles.boldText}>{post.author}</Text>
            <Text>{post.caption}</Text>
            <Text>📍 {post.location} • ❤️ {post.likes} • {post.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView />;
      case 'trips': return <TripsView />;
      case 'discover': return <DiscoverView />;
      default: return <HomeView />;
    }
  };

  // --- Main ---
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Nostia</Text>
      </View>
      {renderView()}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => setCurrentView('home')} style={styles.navButton}>
          <Ionicons name="home-outline" size={24} color={currentView === 'home' ? 'blue' : 'gray'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentView('trips')} style={styles.navButton}>
          <Ionicons name="calendar-outline" size={24} color={currentView === 'trips' ? 'blue' : 'gray'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentView('discover')} style={styles.navButton}>
          <FontAwesome5 name="compass" size={24} color={currentView === 'discover' ? 'blue' : 'gray'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="people-outline" size={24} color={currentView === 'friends' ? 'blue' : 'gray'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { backgroundColor: '#1f1f1f', padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 4 },
  smallText: { fontSize: 12, color: '#aaa', marginTop: 4 },
  boldText: { fontWeight: 'bold', color: 'white' },
  tripItem: { marginBottom: 12 },
  eventItem: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navbar: { padding: 16, backgroundColor: '#111' },
  navTitle: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: '#111', position: 'absolute', bottom: 0, width: '100%' },
  navButton: { alignItems: 'center' },
});
