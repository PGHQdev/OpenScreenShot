/**
 * Pure helpers for the recorder permission flow. The setup page and the popup
 * derive their UI from these; every chrome.* call stays at the call sites so
 * the logic here is testable without a browser.
 */

/** Why a getUserMedia probe failed, mapped to the recovery copy it needs. */
export type MediaBlock = 'dismissed' | 'blocked-site' | 'blocked-system' | 'no-device' | 'unknown';

export type DevicePermission = 'granted' | 'prompt' | 'denied';

export interface PermissionSnapshot {
  tabCapture: boolean;
  camera: DevicePermission;
  mic: DevicePermission;
  allUrls: boolean;
}

export function classifyMediaError(err: unknown): MediaBlock {
  if (!(err instanceof DOMException)) return 'unknown';
  if (err.name === 'NotAllowedError') {
    if (/system/i.test(err.message)) return 'blocked-system';
    if (/dismiss/i.test(err.message)) return 'dismissed';
    return 'blocked-site';
  }
  if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') return 'no-device';
  return 'unknown';
}

/** Chrome's per-site settings page for this extension's origin. */
export function siteSettingsUrl(extensionId: string): string {
  return (
    'chrome://settings/content/siteDetails?site=' +
    encodeURIComponent(`chrome-extension://${extensionId}`)
  );
}

/** tabCapture is the only grant a recording cannot start without. */
export function setupComplete(snap: PermissionSnapshot): boolean {
  return snap.tabCapture;
}

/**
 * Which popup warning chips to show: a device the user toggled on whose
 * permission is hard-denied. 'prompt' is fine — the flow will ask.
 */
export function popupWarnings(
  rec: { mic: boolean; webcam: boolean },
  snap: Pick<PermissionSnapshot, 'camera' | 'mic'>,
): ('mic' | 'webcam')[] {
  const out: ('mic' | 'webcam')[] = [];
  if (rec.mic && snap.mic === 'denied') out.push('mic');
  if (rec.webcam && snap.camera === 'denied') out.push('webcam');
  return out;
}
