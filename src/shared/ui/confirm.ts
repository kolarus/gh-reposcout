import { Alert } from 'react-native';

import { strings } from '@/shared/i18n';

interface ConfirmOptions {
  title: string;
  message: string;
  /** The destructive button's label, e.g. "Clear". */
  confirmLabel: string;
  onConfirm: () => void;
}

/**
 * Asks before a destructive action, in the platform's own dialog: Cancel
 * first, the action styled as destructive (red on iOS). Nothing happens
 * unless the user confirms.
 */
export function confirmDestructive({
  title,
  message,
  confirmLabel,
  onConfirm,
}: ConfirmOptions): void {
  Alert.alert(title, message, [
    { text: strings.common.cancel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
