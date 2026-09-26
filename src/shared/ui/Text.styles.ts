import { makeStyles } from '@/shared/theme';

export const useVariantStyles = makeStyles(theme => ({
  title: theme.typography.title,
  heading: theme.typography.heading,
  subheading: theme.typography.subheading,
  body: theme.typography.body,
  bodyStrong: theme.typography.bodyStrong,
  caption: theme.typography.caption,
  captionStrong: theme.typography.captionStrong,
}));

export const useToneStyles = makeStyles(theme => ({
  primary: { color: theme.colors.textPrimary },
  secondary: { color: theme.colors.textSecondary },
  accent: { color: theme.colors.accent },
  danger: { color: theme.colors.danger },
  warning: { color: theme.colors.warning },
  onAccent: { color: theme.colors.onAccent },
}));
