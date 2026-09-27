import { useEffect, useState } from 'react';
import { hide as hideSplash } from 'react-native-bootsplash';

import { installGlobalErrorHandlers } from '@/shared/monitoring';
import { useTheme } from '@/shared/theme';

import { linking } from './navigation/linking';
import { toNavigationTheme } from './navigation/navigationTheme';
import { Navigation } from './navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';
import { connectQueryManagers, createQueryClient } from './query/queryClient';

installGlobalErrorHandlers();

/**
 * The launch screen stays up until navigation has rendered its first screen,
 * whichever that is (a deep link opens Details, ADR-0006), then fades out.
 */
const onNavigationReady = () => {
  void hideSplash({ fade: true });
};

function ThemedNavigation() {
  const theme = useTheme();
  return (
    <Navigation
      theme={toNavigationTheme(theme)}
      linking={linking}
      onReady={onNavigationReady}
    />
  );
}

/** Root component: providers, then navigation. */
export default function App() {
  // One client per app instance (not per render); tests get a fresh one each.
  const [queryClient] = useState(createQueryClient);
  useEffect(connectQueryManagers, []);

  return (
    <AppProviders queryClient={queryClient}>
      <ThemedNavigation />
    </AppProviders>
  );
}
