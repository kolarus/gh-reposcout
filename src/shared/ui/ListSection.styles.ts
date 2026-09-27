import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  section: { gap: theme.spacing.sm },
  title: { paddingHorizontal: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  footer: { paddingHorizontal: theme.spacing.lg },
}));
