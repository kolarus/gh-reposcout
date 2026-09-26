import { Pressable } from 'react-native';

import { useStyles } from './Button.styles';
import { Icon, type IconName } from './Icon';
import { Text, type TextTone } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'plain';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  /** Overrides the spoken label when the visible one isn't enough. */
  accessibilityLabel?: string;
}

const contentTone: Record<ButtonVariant, TextTone> = {
  primary: 'onAccent',
  secondary: 'primary',
  plain: 'accent',
};

/** Themed button with a 44-pt minimum touch target. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  accessibilityLabel,
}: ButtonProps) {
  const styles = useStyles();
  const tone = contentTone[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon !== undefined ? <Icon name={icon} size="sm" tone={tone} /> : null}
      <Text variant="bodyStrong" tone={tone}>
        {label}
      </Text>
    </Pressable>
  );
}
