import { Pressable, View } from 'react-native';

import { useStyles } from './Chip.styles';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface ChipProps {
  label: string;
  icon?: IconName;
  /** Selected state for filter/sort chips. */
  selected?: boolean;
  /** Without `onPress` the chip is static (e.g. a repo topic). */
  onPress?: () => void;
}

export function Chip({ label, icon, selected = false, onPress }: ChipProps) {
  const styles = useStyles();
  const tone = selected ? 'accent' : 'secondary';
  const content = (
    <>
      {icon !== undefined ? <Icon name={icon} size="sm" tone={tone} /> : null}
      <Text variant="captionStrong" tone={tone}>
        {label}
      </Text>
    </>
  );

  if (onPress === undefined) {
    return <View style={styles.base}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      // Chips are visually compact; extend the touch area to ~44 pt.
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}
