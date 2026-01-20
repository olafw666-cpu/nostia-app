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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adventuresAPI, feedAPI } from '../services/api';

export default function AdventuresScreen() {
  const [adventures, setAdventures] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'adventures' | 'feed'>('adventures');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'hiking', label: 'Hiking', icon: 'walk-outline' },
    { id: 'climbing', label: 'Climbing', icon: 'trending-up-outline' },
    { id: 'water-sports', label: 'Water', icon: 'water-outline' },
    { id: 'camping', label: 'Camping', icon: 'bonfire-outline' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [adventuresData, feedData] = await Promise.all([
        adventuresAPI.getAll(),
        feedAPI.getUserFeed(20),
      ]);
      setAdventures(adventuresData);
      setFeed(feedData);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterAdventures = () => {
    if (!selectedCategory || selectedCategory === 'all') {
      return adventures;
    }
    return adventures.filter((adv: any) => adv.category === selectedCategory);
  };

  const renderAdventureCard = ({ item }: { item: any }) => (
    <View style={styles.adventureCard}>
      <LinearGradient
        colors={['#F59E0B', '#EC4899']}
        style={styles.adventureImage}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="compass" size={40} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.adventureContent}>
        <Text style={styles.adventureTitle}>{item.title}</Text>
        <Text style={styles.adventureLocation}>
          <Ionicons name="location-outline" size={14} /> {item.location}
        </Text>
        {item.description && (
          <Text style={styles.adventureDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.adventureTags}>
          {item.category && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
          )}
          {item.difficulty && (
            <View style={[styles.tag, styles.difficultyTag]}>
              <Text style={styles.tagText}>{item.difficulty}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderFeedPost = ({ item }: { item: any }) => (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.feedAvatar}>
          <Text style={styles.feedInitial}>{item.name?.charAt(0) || 'U'}</Text>
        </View>
        <View style={styles.feedInfo}>
          <Text style={styles.feedName}>{item.name}</Text>
          <Text style={styles.feedTime}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <Text style={styles.feedContent}>{item.content}</Text>
      {item.tripTitle && (
        <View style={styles.feedRelated}>
          <Ionicons name="airplane-outline" size={16} color="#3B82F6" />
          <Text style={styles.feedRelatedText}>{item.tripTitle}</Text>
        </View>
      )}
      {item.eventTitle && (
        <View style={styles.feedRelated}>
          <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
          <Text style={styles.feedRelatedText}>{item.eventTitle}</Text>
        </View>
      )}
    </View>
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
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'adventures' && styles.activeTab]}
          onPress={() => setActiveTab('adventures')}
        >
          <Ionicons
            name="compass"
            size={20}
            color={activeTab === 'adventures' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, activeTab === 'adventures' && styles.activeTabText]}>
            Adventures
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons
            name="newspaper"
            size={20}
            color={activeTab === 'feed' ? '#FFFFFF' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter for Adventures */}
      {activeTab === 'adventures' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.selectedCategoryChip,
              ]}
              onPress={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={18}
                color={selectedCategory === cat.id ? '#FFFFFF' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.selectedCategoryText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {activeTab === 'adventures' ? (
        <FlatList
          data={filterAdventures()}
          renderItem={renderAdventureCard}
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
              <Ionicons name="compass-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyText}>No adventures found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={feed}
          renderItem={renderFeedPost}
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
              <Ionicons name="newspaper-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          }
        />
      )}
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#3B82F6',
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  adventureCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  adventureImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adventureContent: {
    padding: 16,
  },
  adventureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  adventureLocation: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  adventureDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 12,
  },
  adventureTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyTag: {
    backgroundColor: '#7C3AED',
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  feedCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  feedInfo: {
    flex: 1,
  },
  feedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  feedTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  feedContent: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 12,
  },
  feedRelated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  feedRelatedText: {
    fontSize: 14,
    color: '#3B82F6',
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
});
