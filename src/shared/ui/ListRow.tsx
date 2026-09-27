import { Pressable, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { useStyles } from './ListRow.styles';
import { Text } from './Text';

interface ListRowProps {
  label: string;
  /** A second line under the label. */
  description?: string;
  /** Trailing text, e.g. a version number. */
  value?: string;
  /** Trailing icon, e.g. `link-external` for a row that leaves the app. */
  trailingIcon?: IconName;
  /** The label's colour: `accent` for actions, `danger` for irreversible ones. */
  tone?: 'primary' | 'accent' | 'danger';
  /** Without `onPress` the row is static. */
  onPress?: () => void;
  disabled?: boolean;
  /** `link` for rows that open a web page. Default `button`. */
  role?: 'button' | 'link';
}

/**
 * A settings-style row with a 44-pt minimum height. Screen readers hear the
 * label, description and value as one element.
 */
export function ListRow({
  label,
  description,
  value,
  trailingIcon,
  tone = 'primary',
  onPress,
  disabled = false,
  role = 'button',
}: ListRowProps) {
  const styles = useStyles();
  const accessibilityLabel = [label, description, value]
    .filter(part => part !== undefined)
    .join(', ');
  const content = (
    <>
      <View style={styles.text}>
        <Text tone={tone}>{label}</Text>
        {description !== undefined ? (
          <Text variant="caption" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      {value !== undefined ? <Text tone="secondary">{value}</Text> : null}
      {trailingIcon !== undefined ? (
        <Icon name={trailingIcon} size="sm" tone="secondary" />
      ) : null}
    </>
  );

  if (onPress === undefined) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        style={styles.row}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}
