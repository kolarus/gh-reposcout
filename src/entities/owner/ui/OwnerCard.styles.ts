import { StyleSheet } from 'react-native';

import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.touchTarget,
  },
  pressed: { opacity: 0.6 },
  names: { flex: 1, gap: theme.spacing.xxs },
  lines: { gap: theme.spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  notice: { gap: theme.spacing.xs, alignItems: 'flex-start' },
  // The plain button has its own padding; pull it back to the text's edge.
  link: { alignSelf: 'flex-start', marginLeft: -theme.spacing.md },
}));
