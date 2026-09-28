import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  // Twice the icon it holds (`xl`).
  iconCircle: {
    width: theme.iconSize.xl * 2,
    height: theme.iconSize.xl * 2,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  text: { textAlign: 'center' },
  action: { marginTop: theme.spacing.sm },
}));
