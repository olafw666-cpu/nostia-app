import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonCardProps {
  count?: number;
}

/**
 * SkeletonCard - Animated loading skeleton for card components
 * Shows pulsing placeholders while data is loading
 */
export function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Create pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity }]}>
          <View style={styles.line1} />
          <View style={styles.line2} />
          <View style={styles.line3} />
        </Animated.View>
      ))}
    </View>
  );
}

interface SkeletonTextProps {
  lines?: number;
}

/**
 * SkeletonText - Animated loading skeleton for text content
 */
export function SkeletonText({ lines = 3 }: SkeletonTextProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.textLine,
            {
              opacity,
              width: `${100 - i * 15}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  line1: {
    height: 18,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 10,
    width: '75%',
  },
  line2: {
    height: 14,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 8,
    width: '50%',
  },
  line3: {
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 4,
    width: '65%',
  },
  textContainer: {
    padding: 16,
  },
  textLine: {
    height: 14,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 8,
  },
});
