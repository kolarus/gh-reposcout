import { StyleSheet } from 'react-native';

import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  // Two columns; percentages keep them even on any screen width.
  tile: {
    width: '50%',
    gap: theme.spacing.xxs,
    paddingRight: theme.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
