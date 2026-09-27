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
  // Fits the icon and the spinner alike, so swapping them doesn't shift text.
  leading: {
    width: theme.iconSize.md,
    height: theme.iconSize.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    // Line height is left out: on iOS it misaligns single-line input text.
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
  },
}));
