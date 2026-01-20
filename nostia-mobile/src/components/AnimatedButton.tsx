import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';
import { hapticFeedback } from '../utils/haptics';

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  haptic?: boolean;
  disabled?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
}

/**
 * AnimatedButton - Button with scale animation and haptic feedback
 * Provides tactile feedback on press
 */
export default function AnimatedButton({
  onPress,
  children,
  style,
  haptic = true,
  disabled = false,
  hapticType = 'light',
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;

    // Trigger haptic feedback
    if (haptic) {
      if (hapticType === 'light') hapticFeedback.light();
      else if (hapticType === 'medium') hapticFeedback.medium();
      else if (hapticType === 'heavy') hapticFeedback.heavy();
    }

    // Animate scale down
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    // Animate scale back to normal
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1} // Disable default opacity change
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
