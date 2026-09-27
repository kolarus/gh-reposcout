import { Linking } from 'react-native';

import { monitoring } from '@/shared/monitoring';

/**
 * Opens a link in the system browser or the app that handles it. Failures are
 * reported, not thrown: a link that won't open shouldn't break the screen.
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (error) {
    monitoring.captureException(error, { action: 'open-url' });
  }
}
