import { View } from 'react-native';

import { useStyles } from './LanguageDot.styles';
import { languageColor } from '../lib/languageColors';

/** The coloured dot GitHub shows next to a repository's main language. */
export function LanguageDot({ language }: { language: string }) {
  const styles = useStyles();
  return (
    <View
      style={[styles.dot, { backgroundColor: languageColor(language) }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
