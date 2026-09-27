import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  body: { flex: 1, gap: theme.spacing.sm, paddingTop: theme.spacing.xxs },
}));
