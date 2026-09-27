import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: theme.touchTarget,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    // Line height is left out: on iOS it misaligns single-line input text.
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
  },
}));
