import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    gap: theme.spacing.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
}));
