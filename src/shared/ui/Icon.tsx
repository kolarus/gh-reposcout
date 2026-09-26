import {
  Octicons,
  type OcticonsIconName,
} from '@react-native-vector-icons/octicons/static';

import { useTheme, type Theme } from '@/shared/theme';

export type IconName = OcticonsIconName;
type IconSize = keyof Theme['iconSize'];
export type IconTone =
  'primary' | 'secondary' | 'accent' | 'danger' | 'warning' | 'onAccent';

interface IconProps {
  name: IconName;
  size?: IconSize;
  tone?: IconTone;
  /**
   * Only for icons that carry meaning on their own. Icons inside a labelled
   * control are decorative and hidden from screen readers (the default).
   */
  accessibilityLabel?: string;
}

const toneColor = (theme: Theme, tone: IconTone): string => {
  switch (tone) {
    case 'primary':
      return theme.colors.textPrimary;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'accent':
      return theme.colors.accent;
    case 'danger':
      return theme.colors.danger;
    case 'warning':
      return theme.colors.warning;
    case 'onAccent':
      return theme.colors.onAccent;
  }
};

/**
 * Octicons, GitHub's MIT-licensed UI icon set (ADR-0010). The font is embedded
 * at build time (`/static`), so there is no runtime font loading.
 */
export function Icon({
  name,
  size = 'md',
  tone = 'primary',
  accessibilityLabel,
}: IconProps) {
  const theme = useTheme();
  const decorative = accessibilityLabel === undefined;

  return (
    <Octicons
      name={name}
      size={theme.iconSize[size]}
      color={toneColor(theme, tone)}
      accessible={!decorative}
      {...(decorative
        ? {
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          }
        : { accessibilityLabel, accessibilityRole: 'image' as const })}
    />
  );
}
