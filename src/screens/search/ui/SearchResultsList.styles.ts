import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: { flex: 1 },
  /*
   * Veils the previous results while a changed search loads. An overlay, not
   * `opacity` on the list: Android fades each view separately, so an avatar's
   * initials would show through its image.
   */
  staleVeil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.background,
    opacity: 0.5,
    // Visual only: the list itself turns rows and scrolling off while stale,
    // which is reliable on both platforms (an overlay blocking native scroll
    // isn't).
    pointerEvents: 'none',
  },
}));
