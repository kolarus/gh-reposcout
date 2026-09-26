import { View } from 'react-native';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { useStyles } from './StateView.styles';
import { Text } from './Text';

interface StateViewProps {
  icon: IconName;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

/** Full-area empty / error / offline state with an optional recovery action. */
export function StateView({ icon, title, message, action }: StateViewProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size="xl" tone="secondary" />
      </View>
      <Text variant="subheading" accessibilityRole="header" style={styles.text}>
        {title}
      </Text>
      {message !== undefined ? (
        <Text tone="secondary" style={styles.text}>
          {message}
        </Text>
      ) : null}
      {action !== undefined ? (
        <View style={styles.action}>
          <Button
            label={action.label}
            onPress={action.onPress}
            variant="secondary"
          />
        </View>
      ) : null}
    </View>
  );
}
