import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  base: {
    minHeight: theme.touchTarget,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  primary: { backgroundColor: theme.colors.accent },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  plain: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.sm,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
}));
