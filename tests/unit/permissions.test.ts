import { describe, expect, it } from 'vitest';
import {
  classifyMediaError,
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
