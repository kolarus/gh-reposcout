import { trigger } from 'react-native-haptic-feedback';

/**
 * Haptic feedback, and the only place the haptics library is used (ADR-0010).
 * Kept to moments that confirm an action, so it stays meaningful. The
 * library honours the system setting: with haptics turned off, nothing plays.
 */
export const haptics = {
  /** An action took effect: save or unsave, share, pull-to-refresh. */
  impact: (): void => {
    trigger('impactLight');
  },
  /** A choice among options changed, e.g. the theme. */
  selection: (): void => {
    trigger('selection');
  },
};
