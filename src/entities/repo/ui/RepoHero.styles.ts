import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: { gap: theme.spacing.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  titles: { flex: 1, gap: theme.spacing.xxs },
  // The plain button has its own padding; pull it back to the text's edge.
  link: { alignSelf: 'flex-start', marginLeft: -theme.spacing.md },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
}));
