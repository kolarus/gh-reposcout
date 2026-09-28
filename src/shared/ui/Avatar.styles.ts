import { StyleSheet } from 'react-native';

import { makeStyles } from '@/shared/theme';

const circle = (size: number) => ({
  width: size,
  height: size,
  borderRadius: size / 2,
});

export const useStyles = makeStyles(theme => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  image: StyleSheet.absoluteFill,
  // One static style per size, instead of a style object built per render.
  sm: circle(theme.avatarSize.sm),
  md: circle(theme.avatarSize.md),
  lg: circle(theme.avatarSize.lg),
  xl: circle(theme.avatarSize.xl),
}));
