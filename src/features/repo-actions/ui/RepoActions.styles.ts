import { makeStyles } from '@/shared/theme';

export const useStyles = makeStyles(theme => ({
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  action: { flex: 1 },
}));
