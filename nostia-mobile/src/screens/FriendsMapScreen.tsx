import { ms } from '../utils/scale';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { friendsAPI } from '../services/api';

interface FriendLocation {
  id: number;
  username: string;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export default function FriendsMapScreen() {
  const [friends, setFriends] = useState<FriendLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await friendsAPI.getLocations();
      setFriends(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load friend locations');
    } finally {
      setLoading(false);
    }
  };

  const formatUpdated = (updatedAt: string) => {
    const diff = Date.now() - new Date(updatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends Map</Text>
        <Text style={styles.headerSub}>
          {friends.length === 0
            ? 'No friends sharing location'
            : `${friends.length} friend${friends.length > 1 ? 's' : ''} visible`}
        </Text>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={48} color="#374151" />
        <Text style={styles.mapPlaceholderTitle}>Map coming soon</Text>
        <Text style={styles.mapPlaceholderText}>
          Full map view will be available in the production build.
        </Text>
      </View>

      {/* Friend location cards */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No locations to show</Text>
            <Text style={styles.emptyText}>
              Friends appear here once they enable location sharing in the app.
            </Text>
          </View>
        ) : (
          friends.map((friend) => (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendInitial}>{friend.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendUsername}>@{friend.username}</Text>
                <Text style={styles.friendUpdated}>Updated {formatUpdated(friend.updatedAt)}</Text>
              </View>
              <View style={styles.coordBox}>
                <Text style={styles.coordText}>{friend.latitude.toFixed(2)}°</Text>
                <Text style={styles.coordText}>{friend.longitude.toFixed(2)}°</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: { fontSize: ms(22), fontWeight: 'bold', color: '#FFFFFF' },
  headerSub: { fontSize: ms(13), color: '#9CA3AF', marginTop: 2 },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderTitle: { fontSize: ms(16), fontWeight: '600', color: '#6B7280' },
  mapPlaceholderText: { fontSize: ms(12), color: '#4B5563', textAlign: 'center', paddingHorizontal: 32 },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: ms(16), fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  emptyText: { fontSize: ms(13), color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInitial: { fontSize: ms(18), fontWeight: 'bold', color: '#FFFFFF' },
  friendInfo: { flex: 1 },
  friendName: { fontSize: ms(15), fontWeight: '600', color: '#FFFFFF' },
  friendUsername: { fontSize: ms(12), color: '#9CA3AF', marginTop: 1 },
  friendUpdated: { fontSize: ms(11), color: '#6B7280', marginTop: 2 },
  coordBox: { alignItems: 'flex-end' },
  coordText: { fontSize: ms(11), color: '#6B7280', fontVariant: ['tabular-nums'] },
});
