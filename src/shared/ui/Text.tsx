import {
  Text as NativeText,
  type TextProps as NativeTextProps,
} from 'react-native';

import { useToneStyles, useVariantStyles } from './Text.styles';

export type TextVariant =
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong';

export type TextTone =
  'primary' | 'secondary' | 'accent' | 'danger' | 'warning' | 'onAccent';

interface TextProps extends NativeTextProps {
  /** Typography token. Default `body`. */
  variant?: TextVariant;
  /** Semantic colour. Default `primary`. */
  tone?: TextTone;
}

/** Themed text. The only place raw React Native `Text` is used (ADR-0010). */
export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: TextProps) {
  const variants = useVariantStyles();
  const tones = useToneStyles();

  return (
    <NativeText {...rest} style={[variants[variant], tones[tone], style]} />
  );
}
