import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { consentAPI, privacyAPI } from '../services/api';

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [consentStatus, setConsentStatus] = useState<any>(null);
  const [consentHistory, setConsentHistory] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>(null);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [status, history, policyData] = await Promise.all([
        consentAPI.getStatus().catch(() => null),
        consentAPI.getHistory().catch(() => []),
        privacyAPI.getPolicy().catch(() => null),
      ]);
      setConsentStatus(status);
      setConsentHistory(history);
      setPolicy(policyData);
    } catch (err) {
      console.error('Failed to load privacy data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = () => {
    Alert.alert(
      'Revoke Consent',
      'Revoking consent will restrict your app access. You will need to re-consent to continue using Nostia. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await consentAPI.revoke();
              Alert.alert('Success', 'Consent revoked. Your access has been restricted.');
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to revoke consent');
            }
          },
        },
      ]
    );
  };

  const handleReGrantConsent = async () => {
    try {
      await consentAPI.grant({
        locationConsent: true,
        dataCollectionConsent: true,
      });
      Alert.alert('Success', 'Consent granted. Full access restored.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to grant consent');
    }
  };

  const handleDataExport = async () => {
    try {
      const result = await privacyAPI.requestDataExport();
      Alert.alert('Success', 'Data export generated');

      const exportData = await privacyAPI.downloadExport(result.exportId);
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: 'Nostia Data Export',
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to export data');
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data?',
      'This will permanently delete your account and all associated data including trips, friends, messages, posts, and analytics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await privacyAPI.requestDataDeletion();
              Alert.alert(
                'Data Deleted',
                'All personal data has been deleted. You will be logged out.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await SecureStore.deleteItemAsync('jwt_token');
                      (navigation as any).replace('Login');
                    },
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete data');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Consent Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consent Status</Text>
        <View style={styles.statusRow}>
          {consentStatus?.isValid ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.statusActive}>
                Active consent (v{consentStatus.consent?.consentVersion})
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.statusInactive}>No active consent</Text>
            </>
          )}
        </View>

        {consentStatus?.consent && (
          <View style={styles.consentDetails}>
            <Text style={styles.detailText}>
              Location consent: {consentStatus.consent.locationConsent ? 'Granted' : 'Denied'}
            </Text>
            <Text style={styles.detailText}>
              Data collection:{' '}
              {consentStatus.consent.dataCollectionConsent ? 'Granted' : 'Denied'}
            </Text>
            <Text style={styles.detailText}>
              Granted: {new Date(consentStatus.consent.grantedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        {consentStatus?.isValid ? (
          <TouchableOpacity style={styles.revokeButton} onPress={handleRevokeConsent}>
            <Text style={styles.revokeButtonText}>Revoke Consent</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.grantButtonContainer}
            onPress={handleReGrantConsent}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.grantButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.grantButtonText}>Grant Consent</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Policy */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy Policy</Text>
        <Text style={styles.policyVersion}>
          Version {policy?.version || '1.0'} - Last updated {policy?.lastUpdated || 'N/A'}
        </Text>
        <TouchableOpacity
          style={styles.policyToggle}
          onPress={() => setShowPolicy(!showPolicy)}
        >
          <Ionicons name="document-text" size={16} color="#3B82F6" />
          <Text style={styles.policyToggleText}>
            {showPolicy ? 'Hide Policy' : 'View Full Policy'}
          </Text>
        </TouchableOpacity>

        {showPolicy && policy?.sections && (
          <View style={styles.policySections}>
            {policy.sections.map((section: any, i: number) => (
              <View key={i} style={styles.policySection}>
                <Text style={styles.policySectionTitle}>{section.title}</Text>
                <Text style={styles.policySectionContent}>{section.content}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Data Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Data</Text>

        <TouchableOpacity
          style={styles.exportButtonContainer}
          onPress={handleDataExport}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.exportButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export My Data (GDPR)</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteData}>
          <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
          <Text style={styles.deleteButtonText}>Delete All My Data</Text>
        </TouchableOpacity>
      </View>

      {/* Consent History */}
      {consentHistory.length > 0 && (
        <View style={styles.card}>
          <View style={styles.historyHeader}>
            <Ionicons name="time" size={18} color="#9CA3AF" />
            <Text style={styles.cardTitle}>Consent History</Text>
          </View>
          {consentHistory.map((consent: any) => (
            <View key={consent.id} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyVersion}>v{consent.consentVersion}</Text>
                <Text
                  style={[
                    styles.historyStatus,
                    { color: consent.revokedAt ? '#EF4444' : '#10B981' },
                  ]}
                >
                  {consent.revokedAt ? 'Revoked' : 'Active'}
                </Text>
              </View>
              <Text style={styles.historyDate}>
                Granted: {new Date(consent.grantedAt).toLocaleString()}
              </Text>
              {consent.revokedAt && (
                <Text style={styles.historyDate}>
                  Revoked: {new Date(consent.revokedAt).toLocaleString()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusActive: {
    fontSize: 14,
    color: '#10B981',
  },
  statusInactive: {
    fontSize: 14,
    color: '#EF4444',
  },
  consentDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  revokeButton: {
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  revokeButtonText: {
    fontSize: 14,
    color: '#FCA5A5',
    fontWeight: '600',
  },
  grantButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  grantButton: {
    padding: 12,
    alignItems: 'center',
  },
  grantButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  policyVersion: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  policyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  policyToggleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  policySections: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 12,
  },
  policySection: {
    gap: 4,
  },
  policySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  policySectionContent: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  exportButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 8,
    padding: 14,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyVersion: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  historyStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 11,
    color: '#6B7280',
  },
});
