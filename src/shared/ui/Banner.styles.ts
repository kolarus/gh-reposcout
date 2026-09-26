import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  info: { backgroundColor: theme.colors.accentMuted },
  warning: { backgroundColor: theme.colors.warningMuted },
  danger: { backgroundColor: theme.colors.dangerMuted },
  message: { flex: 1 },
}));
