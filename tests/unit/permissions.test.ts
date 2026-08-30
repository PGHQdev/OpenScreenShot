import { describe, expect, it } from 'vitest';
import {
  classifyMediaError,
  devicesGranted,
  PENDING_RECORD_TTL_MS,
  pendingRecordIsLive,
  popupWarnings,
  setupComplete,
  siteSettingsUrl,
  type PendingRecord,
} from '../../src/shared/permissions';
import { DEFAULT_RECORDING_SETTINGS } from '../../src/shared/recording-types';

function mediaError(name: string, message: string): DOMException {
  return new DOMException(message, name);
}

describe('classifyMediaError', () => {
  it('maps a system-level denial to blocked-system', () => {
    expect(classifyMediaError(mediaError('NotAllowedError', 'Permission denied by system'))).toBe(
      'blocked-system',
    );
  });

  it('maps a dismissed prompt to dismissed', () => {
    expect(classifyMediaError(mediaError('NotAllowedError', 'Permission dismissed'))).toBe(
      'dismissed',
    );
  });

  it('maps a plain denial to blocked-site', () => {
    expect(classifyMediaError(mediaError('NotAllowedError', 'Permission denied'))).toBe(
      'blocked-site',
    );
  });

  it('maps a missing device to no-device', () => {
    expect(classifyMediaError(mediaError('NotFoundError', 'Requested device not found'))).toBe(
      'no-device',
    );
  });

  it('maps anything unrecognized to unknown', () => {
    expect(classifyMediaError(mediaError('AbortError', 'Starting videoinput failed'))).toBe(
      'unknown',
    );
    expect(classifyMediaError('boom')).toBe('unknown');
  });
});

describe('siteSettingsUrl', () => {
  it('builds the Chrome site-details URL for the extension origin', () => {
    expect(siteSettingsUrl('abcdefghijklmnop')).toBe(
      'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fabcdefghijklmnop',
    );
  });
});

describe('setupComplete', () => {
  it('is true once tabCapture is granted, whatever the optional grants say', () => {
    expect(
      setupComplete({ tabCapture: true, camera: 'denied', mic: 'prompt', allUrls: false }),
    ).toBe(true);
  });

  it('is false without tabCapture even when everything else is granted', () => {
    expect(
      setupComplete({ tabCapture: false, camera: 'granted', mic: 'granted', allUrls: true }),
    ).toBe(false);
  });
});

describe('popupWarnings', () => {
  it('warns for a toggled-on device whose permission is denied', () => {
    expect(popupWarnings({ mic: true, webcam: true }, { camera: 'denied', mic: 'denied' })).toEqual(
      ['mic', 'webcam'],
    );
  });

  it('stays quiet for devices that are toggled off', () => {
    expect(
      popupWarnings({ mic: false, webcam: false }, { camera: 'denied', mic: 'denied' }),
    ).toEqual([]);
  });

  it('stays quiet while a permission is still promptable', () => {
    expect(
      popupWarnings({ mic: true, webcam: true }, { camera: 'prompt', mic: 'granted' }),
    ).toEqual([]);
  });
});

describe('pendingRecordIsLive', () => {
  const NOW = 1_700_000_000_000;
  const parked: PendingRecord = {
    settings: DEFAULT_RECORDING_SETTINGS,
    tabId: 42,
    at: NOW - 5_000,
  };

  it('accepts a fresh click on the tab it was aimed at', () => {
    expect(pendingRecordIsLive(parked, NOW, 42)).toBe(true);
  });

  it('accepts a click parked exactly at the TTL edge', () => {
    expect(pendingRecordIsLive({ ...parked, at: NOW - PENDING_RECORD_TTL_MS }, NOW, 42)).toBe(true);
  });

  it('rejects a click one millisecond past the TTL', () => {
    expect(pendingRecordIsLive({ ...parked, at: NOW - PENDING_RECORD_TTL_MS - 1 }, NOW, 42)).toBe(
      false,
    );
  });

  it('rejects a click aimed at a tab that is no longer in front', () => {
    expect(pendingRecordIsLive(parked, NOW, 43)).toBe(false);
  });

  it('rejects a click when no tab is active at all', () => {
    expect(pendingRecordIsLive(parked, NOW, null)).toBe(false);
  });

  it('rejects a click stamped in the future (a clock that moved back)', () => {
    expect(pendingRecordIsLive({ ...parked, at: NOW + 1 }, NOW, 42)).toBe(false);
  });

  it('rejects anything that is not a parked click', () => {
    expect(pendingRecordIsLive(undefined, NOW, 42)).toBe(false);
    expect(pendingRecordIsLive(null, NOW, 42)).toBe(false);
    expect(pendingRecordIsLive('record', NOW, 42)).toBe(false);
    expect(pendingRecordIsLive({ tabId: 42, at: NOW }, NOW, 42)).toBe(false);
    expect(pendingRecordIsLive({ settings: DEFAULT_RECORDING_SETTINGS, at: NOW }, NOW, 42)).toBe(
      false,
    );
  });
});

describe('devicesGranted', () => {
  const both = { camera: 'granted' as const, mic: 'granted' as const };

  it('is true when neither device is wanted, whatever the grants are', () => {
    expect(devicesGranted({ mic: false, webcam: false }, { camera: 'denied', mic: 'denied' })).toBe(
      true,
    );
  });

  it('is true when every wanted device is already granted', () => {
    expect(devicesGranted({ mic: true, webcam: true }, both)).toBe(true);
  });

  it('is false when the wanted camera has never been asked', () => {
    expect(devicesGranted({ mic: false, webcam: true }, { ...both, camera: 'prompt' })).toBe(false);
  });

  it('is false when the wanted mic has never been asked', () => {
    expect(devicesGranted({ mic: true, webcam: false }, { ...both, mic: 'prompt' })).toBe(false);
  });

  /**
   * A hard denial raises no prompt either, so skipping the wait would be
   * correct and faster. It still waits: the frame reports its own denial back
   * to the worker, and being wrong in this direction costs a few hundred ms
   * rather than a track the user believes is being recorded.
   */
  it('is false for a denied device, not only an unasked one', () => {
    expect(devicesGranted({ mic: true, webcam: false }, { ...both, mic: 'denied' })).toBe(false);
  });

  it('ignores the grant on a device this recording does not want', () => {
    expect(devicesGranted({ mic: true, webcam: false }, { camera: 'denied', mic: 'granted' })).toBe(
      true,
    );
  });
});
