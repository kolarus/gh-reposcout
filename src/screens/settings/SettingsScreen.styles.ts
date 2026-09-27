import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  selector: { padding: theme.spacing.md },
}));
