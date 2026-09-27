import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  pressed: { backgroundColor: theme.colors.surfaceMuted },
  body: { flex: 1, gap: theme.spacing.xs },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
  updated: { flexShrink: 1 },
}));
