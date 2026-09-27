import { Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon } from './Icon';
import { useStyles } from './SearchField.styles';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  /** The keyboard's search key. */
  onSubmit: (text: string) => void;
  placeholder: string;
  /** Spoken label of the clear button. */
  clearLabel: string;
  autoFocus?: boolean;
}

/** Themed search input with a clear button; raw text in, raw text out. */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  clearLabel,
  autoFocus = false,
}: SearchFieldProps) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Icon name="search" size="sm" tone="secondary" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          onSubmit(value);
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        selectionColor={theme.colors.accent}
        keyboardAppearance={theme.name}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
          }}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          hitSlop={12}
        >
          <Icon name="x-circle-fill" size="sm" tone="secondary" />
        </Pressable>
      ) : null}
    </View>
  );
}
