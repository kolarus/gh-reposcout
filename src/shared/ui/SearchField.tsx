import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';

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
  /** Shows a spinner in place of the search icon, e.g. while results load. */
  loading?: boolean;
  /** Spoken when `loading` turns on, and the spinner's label. */
  loadingLabel?: string;
}

/**
 * Themed search input with a clear button that empties it and focuses it
 * for the next query; raw text in, raw text out. While
 * `loading`, a spinner replaces the search icon (same-size slot, so the text
 * doesn't move) and screen readers hear `loadingLabel` once.
 */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  clearLabel,
  autoFocus = false,
  loading = false,
  loadingLabel,
}: SearchFieldProps) {
  const theme = useTheme();
  const styles = useStyles();
  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (loading && loadingLabel !== undefined) {
      AccessibilityInfo.announceForAccessibility(loadingLabel);
    }
  }, [loading, loadingLabel]);

  return (
    <View style={styles.container}>
      <View style={styles.leading}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.accent}
            accessibilityLabel={loadingLabel}
          />
        ) : (
          <Icon name="search" size="sm" tone="secondary" />
        )}
      </View>
      <TextInput
        ref={inputRef}
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
            // Clearing is how a new search starts, so the keyboard comes up,
            // as in the platforms' own search fields.
            inputRef.current?.focus();
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
