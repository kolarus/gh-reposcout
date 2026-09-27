import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    gap: theme.spacing.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.sm },
  mainActions: { flex: 1 },
  // Frames the icon toggle like its neighbouring Share button.
  saveBox: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
