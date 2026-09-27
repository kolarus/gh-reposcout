import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: { gap: theme.spacing.lg, padding: theme.spacing.lg },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  titles: { flex: 1, gap: theme.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.md },
  tile: { width: '50%', gap: theme.spacing.xs, paddingRight: theme.spacing.sm },
}));
