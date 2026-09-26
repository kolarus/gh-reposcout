/**
 * Native entry point. Kept as `.js` because the Gradle plugin and the Xcode
 * bundle phase default to `index.js` (ADR-0004); all app code is TypeScript.
 *
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
