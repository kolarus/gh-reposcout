import { strings } from '@/shared/i18n';

import { StateView } from './StateView';

/** Default fallback for error boundaries: explain and offer a retry. */
export function ErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <StateView
      icon="alert"
      title={strings.errors.screenTitle}
      message={strings.errors.screenMessage}
      action={{ label: strings.errors.tryAgain, onPress: onReset }}
    />
  );
}
