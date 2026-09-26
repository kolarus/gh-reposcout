import { StyleSheet } from 'react-native';

import { makeStyles } from '@/shared/theme';

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
}));
