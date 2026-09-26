import { useNavigation } from '@react-navigation/native';

import { strings } from '@/shared/i18n';
import { StateView } from '@/shared/ui';

/** Placeholder until theme and data settings land in Phase 4. */
export function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <StateView
      icon="gear"
      title={strings.placeholders.settingsTitle}
      message={strings.placeholders.settingsMessage}
      {...(__DEV__ && {
        action: {
          label: strings.dev.uiCatalog,
          onPress: () => {
            navigation.navigate('UiCatalog');
          },
        },
      })}
    />
  );
}
