import { Pressable, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { useStyles } from './SegmentedControl.styles';
import { Text } from './Text';

interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "Theme". */
  accessibilityLabel: string;
}

/**
 * One choice out of a few, side by side. Each segment is a radio button that
 * announces whether it's selected. The group isn't made `accessible`: that
 * would merge the segments into one element on iOS.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.track}
    >
      {segments.map(segment => {
        const selected = segment.value === value;
        const tone = selected ? 'primary' : 'secondary';
        return (
          <Pressable
            key={segment.value}
            onPress={() => {
              if (!selected) onChange(segment.value);
            }}
            accessibilityRole="radio"
            accessibilityLabel={segment.label}
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.selected,
              pressed && !selected && styles.pressed,
            ]}
          >
            {segment.icon !== undefined ? (
              <Icon name={segment.icon} size="sm" tone={tone} />
            ) : null}
            <Text variant="captionStrong" tone={tone}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
