import { StyleSheet } from 'react-native';

import { makeStyles } from '@/shared/theme';

const DOT_SIZE = 10;

export const useStyles = makeStyles(theme => ({
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    // Keeps light colours (e.g. JavaScript's yellow) visible on light surfaces.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
}));
