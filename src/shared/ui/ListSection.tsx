import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { Divider } from './Divider';
import { useStyles } from './ListSection.styles';
import { Text } from './Text';

interface ListSectionProps {
  title: string;
  /** Small print under the card. */
  footer?: string;
  /** Rows; `false` and `null` children (conditional rows) are skipped. */
  children: ReactNode;
}

/** A titled card of rows with hairlines between them, as in system settings. */
export function ListSection({ title, footer, children }: ListSectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text
        variant="captionStrong"
        tone="secondary"
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </Text>
      <View style={styles.card}>
        {Children.toArray(children).map((child, index) => (
          <Fragment key={isValidElement(child) ? child.key : index}>
            {index > 0 ? <Divider /> : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer !== undefined ? (
        <Text variant="caption" tone="secondary" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}
