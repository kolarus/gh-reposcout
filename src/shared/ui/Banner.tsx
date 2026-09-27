import { View } from 'react-native';

import { useStyles } from './Banner.styles';
import { Button } from './Button';
import { Icon, type IconName, type IconTone } from './Icon';
import { Text } from './Text';

type BannerTone = 'info' | 'warning' | 'danger';

interface BannerProps {
  tone: BannerTone;
  icon: IconName;
  message: string;
  /**
   * What screen readers say instead of `message`. Use it when the visible text
   * changes often (a countdown), so the live region isn't re-announced every
   * second.
   */
  accessibilityMessage?: string;
  action?: { label: string; onPress: () => void };
}

const contentTone: Record<BannerTone, IconTone> = {
  info: 'accent',
  warning: 'warning',
  danger: 'danger',
};

/** Inline status strip, e.g. offline or rate limited. Announced by screen readers. */
export function Banner({
  tone,
  icon,
  message,
  accessibilityMessage,
  action,
}: BannerProps) {
  const styles = useStyles();

  return (
    // The alert role sits on the message: a plain View isn't an accessibility
    // element, and making the whole row one would hide the action button on iOS.
    <View style={[styles.base, styles[tone]]} accessibilityLiveRegion="polite">
      <Icon name={icon} size="sm" tone={contentTone[tone]} />
      <Text
        variant="caption"
        tone={contentTone[tone]}
        style={styles.message}
        accessibilityRole="alert"
        accessibilityLabel={accessibilityMessage ?? message}
      >
        {message}
      </Text>
      {action !== undefined ? (
        <Button label={action.label} onPress={action.onPress} variant="plain" />
      ) : null}
    </View>
  );
}
