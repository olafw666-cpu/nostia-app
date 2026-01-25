import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tripsAPI } from '../services/api';
import CreateTripModal from '../components/CreateTripModal';
import AIChatModal from '../components/AIChatModal';

export default function TripsScreen() {
  const navigation = useNavigation();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedTripForAI, setSelectedTripForAI] = useState<any>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsAPI.getAll();
      setTrips(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const handleTripCreated = () => {
    setShowCreateModal(false);
    loadTrips();
  };

  const handleViewVault = (trip: any) => {
    // Navigate to VaultScreen with trip ID
    (navigation as any).navigate('Vault', { tripId: trip.id, tripTitle: trip.title });
  };

  const handleDeleteTrip = (trip: any) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.title}"? This will remove all associated data including expenses, photos, and participants.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripsAPI.delete(trip.id);
              Alert.alert('Success', 'Trip deleted successfully');
              loadTrips();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete trip');
            }
          },
        },
      ]
    );
  };

  const renderTripCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewVault(item)}
      onLongPress={() => handleDeleteTrip(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripTitle}>{item.title}</Text>
          <Text style={styles.tripDestination}>{item.destination}</Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>
            {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.tripDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={18} color="#9CA3AF" />
          <Text style={styles.statText}>{item.participants?.length || 0} people</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => {
              setSelectedTripForAI(item);
              setShowAIChat(true);
            }}
          >
            <Ionicons name="sparkles" size={16} color="#A78BFA" />
            <Text style={styles.aiButtonText}>AI Plan</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={18} color="#10B981" />
            <Text style={styles.vaultText}>Vault</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        renderItem={renderTripCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="airplane-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>Create your first adventure!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <CreateTripModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTripCreated={handleTripCreated}
      />

      <AIChatModal
        visible={showAIChat}
        onClose={() => {
          setShowAIChat(false);
          setSelectedTripForAI(null);
        }}
        tripContext={selectedTripForAI}
        onGenerateItinerary={(itinerary) => {
          console.log('Generated itinerary:', itinerary);
          Alert.alert('Success', 'Itinerary generated! Check the AI chat for details.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tripDestination: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dateBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dateText: {
    fontSize: 12,
    color: '#93C5FD',
    fontWeight: '600',
  },
  tripDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  vaultText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aiButtonText: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
