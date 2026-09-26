import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { styles } from './App.styles';

/**
 * Root component. Placeholder from the template until Phase 1 wires up
 * providers and navigation.
 */
export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="src/app/App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}
