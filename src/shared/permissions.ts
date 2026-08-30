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
  /**
   * True once `chrome.permissions.request` has actually been dispatched. The
   * park is written and made durable *before* the request, so a popup dismissed
   * in between leaves a record of a click that never asked anything — and a
   * later popup must not report that as a refusal. The worker ignores this
   * field: it only ever runs from `onAdded`, which is itself proof a request
   * was made and answered.
   */
  asked?: boolean;
  /**
   * `devicesGranted` at the click. The worker cannot recompute it — it has no
   * `navigator.permissions` — and this click may be resumed by the worker
   * after Chrome's dialog tore the popup down, so the answer travels with it.
   */
  devicesGranted?: boolean;
}

/**
 * Whether a parked Record click may still start a recording. It must be
 * shaped right, recent, and still aimed at the tab that was in front when it
 * was made.
 *
 * The tab id does not pin the recording to that tab — the start queries the
 * active tab again and records whatever it finds. What the check does is
 * narrow the window in which a leftover click can be picked up by an
 * unrelated grant: from the whole TTL down to the microseconds between the
 * worker reading the active tab and the start reading it again. Without it, a
 * refusal the popup never saw could sit here and turn a later grant from the
 * setup page into a recording of the setup page.
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

/**
 * Whether the camera/mic prompt this recording would raise has already been
 * answered, so the start has nothing to wait for.
 *
 * The start mounts the overlay's permission iframe and parks on its
 * `REC_FRAME_READY` because that iframe is the only surface on this origin
 * that can show the prompt. Once the grant exists the frame raises no prompt
 * at all, and the engine's own `getUserMedia` succeeds silently — so the wait
 * buys nothing and costs up to `FRAME_READY_TIMEOUT_MS`.
 *
 * A worker cannot answer this: `navigator.permissions` needs a document. The
 * popup, which already queries both devices for its warning chips, reads it
 * and hands the answer to the start. Anything other than 'granted' — 'prompt',
 * 'denied', or a query that threw and fell back to 'prompt' — keeps the wait,
 * so being wrong here can only be slow, never silent.
 */
export function devicesGranted(
  rec: { mic: boolean; webcam: boolean },
  snap: Pick<PermissionSnapshot, 'camera' | 'mic'>,
): boolean {
  if (rec.webcam && snap.camera !== 'granted') return false;
  if (rec.mic && snap.mic !== 'granted') return false;
  return true;
}
