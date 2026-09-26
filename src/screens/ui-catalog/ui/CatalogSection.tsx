import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/ui';

import { useStyles } from './CatalogSection.styles';

export function CatalogSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text variant="captionStrong" tone="secondary" accessibilityRole="header">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}
