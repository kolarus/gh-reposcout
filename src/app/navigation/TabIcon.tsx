import { Icon, type IconName } from '@/shared/ui';

/** Tab bar icon: accent when focused, secondary otherwise. */
export function tabIcon(name: IconName) {
  // Named so it shows up properly in React DevTools.
  function TabBarIcon({ focused }: { focused: boolean }) {
    return <Icon name={name} tone={focused ? 'accent' : 'secondary'} />;
  }
  return TabBarIcon;
}
