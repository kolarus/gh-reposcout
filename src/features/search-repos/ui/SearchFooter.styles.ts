import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  // Fixed minimum height: switching between spinner and text doesn't jump.
  container: {
    minHeight: theme.touchTarget + theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  text: { textAlign: 'center' },
}));
