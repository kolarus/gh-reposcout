import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  button: {
    width: theme.touchTarget,
    height: theme.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
  },
  pressed: { backgroundColor: theme.colors.surfaceMuted },
}));
