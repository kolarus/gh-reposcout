import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: {
    gap: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
}));
