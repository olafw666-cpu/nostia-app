import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 / standard mobile)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Responsive width scaling
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

// Responsive height scaling
export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

// Scale font size based on screen width
export const fontScale = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Moderate scaling (for elements that shouldn't scale too aggressively)
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return size + (size * (scale - 1) * factor);
};

// Check if device is a tablet
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (Platform.OS === 'ios' && SCREEN_WIDTH >= 768) ||
    (Platform.OS === 'android' && SCREEN_WIDTH >= 600) ||
    aspectRatio < 1.6
  );
};

// Check if device has a small screen (e.g., iPhone SE)
export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 700;
};

// Check if device has a large screen
export const isLargeScreen = (): boolean => {
  return SCREEN_WIDTH >= 414;
};

// Get responsive padding based on screen size
export const getResponsivePadding = (): number => {
  if (isSmallScreen()) return 12;
  if (isTablet()) return 24;
  return 16;
};

// Get responsive font sizes
export const fontSize = {
  xs: fontScale(10),
  sm: fontScale(12),
  md: fontScale(14),
  lg: fontScale(16),
  xl: fontScale(18),
  xxl: fontScale(24),
  xxxl: fontScale(32),
};

// Get responsive spacing
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(24),
  xxl: moderateScale(32),
};

// Screen dimensions for use in components
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallScreen(),
  isLarge: isLargeScreen(),
  isTablet: isTablet(),
};

// Responsive container max width (for tablets)
export const getMaxContentWidth = (): number | string => {
  if (isTablet()) return 600;
  return '100%';
};

export default {
  wp,
  hp,
  fontScale,
  moderateScale,
  isTablet,
  isSmallScreen,
  isLargeScreen,
  getResponsivePadding,
  fontSize,
  spacing,
  screen,
  getMaxContentWidth,
};
