import { useEffect, useState } from 'react';
import { Animated, type DimensionValue } from 'react-native';

import { useTheme, type Theme } from '@/shared/theme';

import { useStyles } from './Skeleton.styles';

interface SkeletonProps {
  width: DimensionValue;
  height: number;
  radius?: keyof Theme['radii'];
}

const PULSE_MS = 700;

/**
 * Placeholder block with an opacity pulse on the native thread (ADR-0010).
 * Shape-matched skeletons avoid layout shift when content arrives.
 * Hidden from screen readers; the surrounding screen announces loading.
 */
export function Skeleton({ width, height, radius = 'sm' }: SkeletonProps) {
  const theme = useTheme();
  const styles = useStyles();
  // useState keeps one Animated.Value per mount without reading a ref during
  // render (a React Compiler rule, ADR-0014).
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      testID="skeleton"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.block,
        { width, height, borderRadius: theme.radii[radius], opacity },
      ]}
    />
  );
}
