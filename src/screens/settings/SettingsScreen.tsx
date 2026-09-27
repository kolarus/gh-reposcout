import { useNavigation } from '@react-navigation/native';
import { ScrollView, View } from 'react-native';

import { clearSavedRepos, useSavedCount } from '@/features/save-repo';
import { useRecentSearches } from '@/features/search-repos';
import { ThemeSelector } from '@/features/switch-theme';
import { APP_VERSION, appConfig } from '@/shared/config';
import { strings } from '@/shared/i18n';
import { openExternalUrl } from '@/shared/lib';
import { confirmDestructive, ListRow, ListSection } from '@/shared/ui';

import { useStyles } from './SettingsScreen.styles';
import { useCachedResults } from './useCachedResults';

const copy = strings.settings;

/**
 * Appearance, the data kept on this device (each clear asks first), and
 * About. It coordinates several features' public APIs, so it lives in the
 * screen layer (ADR-0005).
 */
export function SettingsScreen() {
  const styles = useStyles();
  const navigation = useNavigation();
  const cached = useCachedResults();
  const recentCount = useRecentSearches(state => state.queries.length);
  const savedCount = useSavedCount();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ListSection title={copy.appearance.title}>
        <View style={styles.selector}>
          <ThemeSelector />
        </View>
      </ListSection>

      <ListSection title={copy.data.title}>
        <ListRow
          label={copy.data.cache}
          description={copy.data.cacheDescription}
          tone="accent"
          disabled={cached.count === 0}
          onPress={() => {
            confirmDestructive({
              title: copy.data.cacheConfirmTitle,
              message: copy.data.cacheConfirmMessage,
              confirmLabel: copy.data.clear,
              onConfirm: cached.clear,
            });
          }}
        />
        <ListRow
          label={copy.data.recent}
          description={
            recentCount === 0
              ? copy.data.none
              : copy.data.recentCount(recentCount)
          }
          tone="accent"
          disabled={recentCount === 0}
          onPress={() => {
            confirmDestructive({
              title: copy.data.recentConfirmTitle,
              message: copy.data.recentConfirmMessage,
              confirmLabel: copy.data.clear,
              onConfirm: useRecentSearches.getState().clear,
            });
          }}
        />
        <ListRow
          label={copy.data.saved}
          description={
            savedCount === 0 ? copy.data.none : copy.data.savedCount(savedCount)
          }
          tone="danger"
          disabled={savedCount === 0}
          onPress={() => {
            confirmDestructive({
              title: copy.data.savedConfirmTitle,
              message: copy.data.savedConfirmMessage,
              confirmLabel: copy.data.remove,
              onConfirm: clearSavedRepos,
            });
          }}
        />
      </ListSection>

      <ListSection title={copy.about.title} footer={copy.about.footer}>
        <ListRow label={copy.about.version} value={APP_VERSION} />
        <ListRow
          label={copy.about.sourceCode}
          trailingIcon="link-external"
          role="link"
          onPress={() => {
            void openExternalUrl(appConfig.about.sourceCodeUrl);
          }}
        />
        <ListRow
          label={copy.about.decisions}
          trailingIcon="link-external"
          role="link"
          onPress={() => {
            void openExternalUrl(appConfig.about.decisionsUrl);
          }}
        />
      </ListSection>

      {__DEV__ ? (
        <ListSection title={copy.developer.title}>
          <ListRow
            label={strings.dev.uiCatalog}
            trailingIcon="chevron-right"
            onPress={() => {
              navigation.navigate('UiCatalog');
            }}
          />
        </ListSection>
      ) : null}
    </ScrollView>
  );
}
