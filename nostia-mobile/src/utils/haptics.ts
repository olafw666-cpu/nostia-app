import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility for React Native
 * Provides consistent tactile feedback across the app
 */

export const hapticFeedback = {
  /**
   * Light impact - For button presses, selections
   */
  light: () => {
    try {
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Medium impact - For confirmations, toggles
   */
  medium: () => {
    try {
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Heavy impact - For important actions, errors
   */
  heavy: () => {
    try {
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Success notification - For successful operations
   */
  success: () => {
    try {
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Warning notification - For warnings
   */
  warning: () => {
    try {
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Error notification - For errors
   */
  error: () => {
    try {
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },

  /**
   * Selection feedback - For picker/selector changes
   */
  selection: () => {
    try {
      return Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  },
};
