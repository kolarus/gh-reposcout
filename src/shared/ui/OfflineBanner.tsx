import { strings } from '@/shared/i18n';
import { useIsOnline } from '@/shared/lib';

import { Banner } from './Banner';

/** Shown while the device is offline; data already loaded stays visible (ADR-0011). */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  if (isOnline) return null;
  return (
    <Banner
      tone="warning"
      icon="cloud-offline"
      message={strings.offline.banner}
    />
  );
}
