import { strings } from '@/shared/i18n';
import { StateView } from '@/shared/ui';

/** Placeholder until saved repositories land in Phase 3b. */
export function SavedScreen() {
  return (
    <StateView
      icon="bookmark"
      title={strings.placeholders.savedTitle}
      message={strings.placeholders.savedMessage}
    />
  );
}
