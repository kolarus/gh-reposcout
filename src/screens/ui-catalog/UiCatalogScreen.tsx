import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useTheme,
  useThemePreference,
  type ThemeColors,
  type ThemePreference,
} from '@/shared/theme';
import {
  Avatar,
  Banner,
  Button,
  Chip,
  Divider,
  Icon,
  Skeleton,
  StateView,
  Text,
  type IconName,
  type TextVariant,
} from '@/shared/ui';

import { catalogCopy as copy } from './catalogCopy';
import { CatalogSection } from './ui/CatalogSection';
import { useStyles } from './UiCatalogScreen.styles';

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark'];
const TEXT_VARIANTS: readonly TextVariant[] = [
  'title',
  'heading',
  'subheading',
  'body',
  'bodyStrong',
  'caption',
  'captionStrong',
];
const ICONS: readonly IconName[] = [
  'search',
  'star',
  'repo-forked',
  'eye',
  'issue-opened',
  'bookmark',
  'bookmark-filled',
  'git-branch',
  'clock',
  'law',
  'gear',
  'link-external',
  'share',
  'cloud-offline',
];
const noop = () => undefined;

/**
 * Developer-only catalog of tokens and shared components, in the current theme.
 * Reachable only in development builds (Settings → UI catalog).
 */
export function UiCatalogScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const preference = useThemePreference(state => state.preference);
  const setPreference = useThemePreference(state => state.setPreference);
  // A mapped Record (unlike the ThemeColors interface) keeps Object.entries typed.
  const colors: Readonly<Record<keyof ThemeColors, string>> = theme.colors;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
        },
      ]}
    >
      <Text tone="secondary">{copy.subtitle}</Text>

      <CatalogSection title={copy.sections.theme}>
        <View style={styles.row}>
          {THEME_OPTIONS.map(option => (
            <Chip
              key={option}
              label={copy.themes[option]}
              selected={preference === option}
              onPress={() => {
                setPreference(option);
              }}
            />
          ))}
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.colors}>
        <View style={styles.row}>
          {Object.entries(colors).map(([name, color]) => (
            <View key={name} style={styles.swatch}>
              <View style={[styles.swatchColor, { backgroundColor: color }]} />
              <Text variant="caption" tone="secondary">
                {name}
              </Text>
            </View>
          ))}
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.typography}>
        <View style={styles.column}>
          {TEXT_VARIANTS.map(variant => (
            <Text key={variant} variant={variant} numberOfLines={1}>
              {`${variant} · ${copy.sample}`}
            </Text>
          ))}
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.buttons}>
        <View style={styles.row}>
          <Button label={copy.buttons.primary} onPress={noop} />
          <Button
            label={copy.buttons.secondary}
            onPress={noop}
            variant="secondary"
          />
          <Button label={copy.buttons.plain} onPress={noop} variant="plain" />
          <Button label={copy.buttons.disabled} onPress={noop} disabled />
          <Button
            label={copy.buttons.withIcon}
            onPress={noop}
            icon="link-external"
            variant="secondary"
          />
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.chips}>
        <View style={styles.row}>
          <Chip label={copy.chips.topic} />
          <Chip label={copy.chips.best} selected onPress={noop} />
          <Chip label={copy.chips.stars} icon="star" onPress={noop} />
          <Chip label={copy.chips.updated} icon="clock" onPress={noop} />
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.icons}>
        <View style={styles.row}>
          {ICONS.map(name => (
            <Icon key={name} name={name} size="lg" tone="secondary" />
          ))}
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.avatars}>
        <View style={styles.row}>
          <Avatar name={copy.avatarName} size="sm" />
          <Avatar name={copy.avatarName} size="md" />
          <Avatar name={copy.avatarName} size="lg" />
          <Avatar name={copy.avatarName} size="xl" uri={copy.avatarUri} />
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.banners}>
        <View style={styles.card}>
          <Banner
            tone="info"
            icon="bookmark-filled"
            message={copy.banners.info}
          />
          <Divider />
          <Banner tone="warning" icon="clock" message={copy.banners.warning} />
          <Divider />
          <Banner
            tone="danger"
            icon="cloud-offline"
            message={copy.banners.danger}
            action={{ label: copy.banners.retry, onPress: noop }}
          />
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.skeleton}>
        <View style={styles.skeletonCard}>
          <Skeleton width={40} height={40} radius="pill" />
          <View style={styles.skeletonLines}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="100%" height={14} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      </CatalogSection>

      <CatalogSection title={copy.sections.stateView}>
        <View style={styles.card}>
          <StateView
            icon="search"
            title={copy.stateView.title}
            message={copy.stateView.message}
            action={{ label: copy.stateView.action, onPress: noop }}
          />
        </View>
      </CatalogSection>
    </ScrollView>
  );
}
