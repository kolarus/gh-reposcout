import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
}));
