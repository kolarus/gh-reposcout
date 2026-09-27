import { StyleSheet } from 'react-native';

import { makeStyles } from '@/shared/theme';

const TRACK_PADDING = 2;

export const useStyles = makeStyles(theme => ({
  track: {
    flexDirection: 'row',
    gap: TRACK_PADDING,
    padding: TRACK_PADDING,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  segment: {
    flex: 1,
    // With the track's padding, the whole control is 44 pt tall.
    minHeight: theme.touchTarget - 2 * TRACK_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  selected: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pressed: { opacity: 0.7 },
}));
