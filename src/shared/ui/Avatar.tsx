import { Image, View } from 'react-native';

import { useTheme, type Theme } from '@/shared/theme';

import { useStyles } from './Avatar.styles';
import { Text, type TextVariant } from './Text';

type AvatarSize = keyof Theme['avatarSize'];

interface AvatarProps {
  /** Already sized for the display (entities build it, e.g. GitHub's `s=` param). */
  uri?: string | undefined;
  /** Used for the initials placeholder shown under (or instead of) the image. */
  name: string;
  size?: AvatarSize;
}

const initialsVariant: Record<AvatarSize, TextVariant> = {
  sm: 'captionStrong',
  md: 'bodyStrong',
  lg: 'heading',
  xl: 'title',
};

export function initialsOf(name: string): string {
  const letters = name
    .split(/[\s\-_/.]+/)
    .filter(part => part.length > 0)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

/**
 * Circular avatar (ADR-0009). Initials sit underneath so there's never an empty
 * circle while loading or offline. `key={uri}` stops a recycled list row from
 * briefly showing the previous row's image; iOS `force-cache` serves a cached
 * copy even when the HTTP cache has expired (works offline).
 */
export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const theme = useTheme();
  const styles = useStyles();
  const px = theme.avatarSize[size];

  return (
    <View
      style={[
        styles.container,
        { width: px, height: px, borderRadius: px / 2 },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text variant={initialsVariant[size]} tone="secondary">
        {initialsOf(name)}
      </Text>
      {uri !== undefined && uri !== '' ? (
        <Image
          key={uri}
          testID="avatar-image"
          source={{ uri, cache: 'force-cache' }}
          style={styles.image}
          fadeDuration={0}
        />
      ) : null}
    </View>
  );
}
