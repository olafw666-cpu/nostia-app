import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import {
  wp,
  hp,
  fontScale,
  moderateScale,
  isTablet,
  isSmallScreen,
  isLargeScreen,
  getResponsivePadding,
  getMaxContentWidth,
} from '../utils/responsive';

interface ResponsiveDimensions {
  width: number;
  height: number;
  isSmall: boolean;
  isLarge: boolean;
  isTablet: boolean;
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
  fontScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  padding: number;
  maxContentWidth: number | string;
}

/**
 * Custom hook for responsive dimensions that updates on orientation change
 *
 * Usage:
 * const { width, height, isTablet, wp, hp, fontScale } = useResponsive();
 */
export const useResponsive = (): ResponsiveDimensions => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }: { window: ScaledSize }) => {
        setDimensions({
          width: window.width,
          height: window.height,
        });
      }
    );

    return () => subscription?.remove();
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isSmall: isSmallScreen(),
    isLarge: isLargeScreen(),
    isTablet: isTablet(),
    wp,
    hp,
    fontScale,
    moderateScale,
    padding: getResponsivePadding(),
    maxContentWidth: getMaxContentWidth(),
  };
};

export default useResponsive;
