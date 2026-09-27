import { strings } from '@/shared/i18n';
import { haptics } from '@/shared/lib';
import { useThemePreference, type ThemePreference } from '@/shared/theme';
import { SegmentedControl, type IconName } from '@/shared/ui';

const SEGMENTS = [
  {
    value: 'system',
    label: strings.settings.appearance.system,
    icon: 'device-mobile',
  },
  { value: 'light', label: strings.settings.appearance.light, icon: 'sun' },
  { value: 'dark', label: strings.settings.appearance.dark, icon: 'moon' },
] as const satisfies readonly {
  value: ThemePreference;
  label: string;
  icon: IconName;
}[];

/**
 * System / Light / Dark. The choice applies at once and is kept across
 * launches; `system` follows the device setting (ADR-0010).
 */
export function ThemeSelector() {
  const preference = useThemePreference(state => state.preference);
  const setPreference = useThemePreference(state => state.setPreference);
  return (
    <SegmentedControl
      segments={SEGMENTS}
      value={preference}
      onChange={next => {
        haptics.selection();
        setPreference(next);
      }}
      accessibilityLabel={strings.settings.appearance.theme}
    />
  );
}
