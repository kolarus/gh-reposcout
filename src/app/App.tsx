import { useEffect, useState } from 'react';

import { installGlobalErrorHandlers } from '@/shared/monitoring';
import { useTheme } from '@/shared/theme';

import { linking } from './navigation/linking';
import { toNavigationTheme } from './navigation/navigationTheme';
import { Navigation } from './navigation/RootNavigator';
import { AppProviders } from './providers/AppProviders';
import { connectQueryManagers, createQueryClient } from './query/queryClient';

installGlobalErrorHandlers();

function ThemedNavigation() {
  const theme = useTheme();
  return <Navigation theme={toNavigationTheme(theme)} linking={linking} />;
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
