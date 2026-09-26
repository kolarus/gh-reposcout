import { StyleSheet } from 'react-native';

import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
}));
