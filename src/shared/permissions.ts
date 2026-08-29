/**
 * Pure helpers for the recorder permission flow. The setup page and the popup
 * derive their UI from these; every chrome.* call stays at the call sites so
 * the logic here is testable without a browser.
 */
import type { RecordingSettings } from './recording-types';

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

// --- Parked Record click ------------------------------------------------------

/**
 * Session key holding a Record click that is waiting on the tabCapture grant.
 * The popup writes it; the worker consumes it from `permissions.onAdded`.
 */
export const PENDING_RECORD_KEY = 'openscreenshot:pending-record';

/**
 * How long a parked click stays startable. It has to outlast a human reading
 * Chrome's permission dialog, and nothing more — past that the grant is a
 * deliberate visit to the setup page, not the click that is waiting here.
 */
export const PENDING_RECORD_TTL_MS = 120_000;

export interface PendingRecord {
  settings: RecordingSettings;
  continueSessionId?: string;
  /** The tab the click was aimed at. */
  tabId: number;
  /** `Date.now()` at the click. */
  at: number;
}

/**
 * Whether a parked Record click may still start a recording. It must be
 * shaped right, recent, and still aimed at the tab in front: a grant that
 * arrives later, or from another tab, belongs to a different intent, and
 * starting on it would record whatever the user happens to be looking at.
 */
export function pendingRecordIsLive(
  value: unknown,
  now: number,
  activeTabId: number | null,
): value is PendingRecord {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Partial<PendingRecord>;
  if (typeof rec.tabId !== 'number' || typeof rec.at !== 'number') return false;
  if (!rec.settings || typeof rec.settings !== 'object') return false;
  if (activeTabId == null || rec.tabId !== activeTabId) return false;
  return now - rec.at >= 0 && now - rec.at <= PENDING_RECORD_TTL_MS;
}
