import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  row: {
    minHeight: theme.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  text: { flex: 1, gap: theme.spacing.xxs },
  pressed: { backgroundColor: theme.colors.surfaceMuted },
  disabled: { opacity: 0.4 },
}));
