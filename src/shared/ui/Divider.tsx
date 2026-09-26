import { View } from 'react-native';

import { useStyles } from './Divider.styles';

/** Hairline separator; cheaper than per-row shadows in long lists (ADR-0009). */
export function Divider() {
  const styles = useStyles();
  return <View style={styles.line} />;
}
