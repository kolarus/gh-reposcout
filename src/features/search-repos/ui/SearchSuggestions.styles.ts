import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  section: { gap: theme.spacing.sm },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  recentQuery: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: theme.touchTarget,
  },
  pressed: { opacity: 0.6 },
  recentText: { flex: 1 },
  remove: {
    minWidth: theme.touchTarget,
    minHeight: theme.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
}));
