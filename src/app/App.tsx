import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UiCatalogScreen } from '@/screens/ui-catalog';
import { ThemeProvider, useTheme } from '@/shared/theme';

/** Status bar icons follow the active theme, not just the OS setting. */
function ThemedStatusBar() {
  const theme = useTheme();
  return (
    <StatusBar
      barStyle={theme.name === 'dark' ? 'light-content' : 'dark-content'}
    />
  );
}

/**
 * Root component. Until navigation lands (Phase 1b) it shows the UI catalog.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <UiCatalogScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
