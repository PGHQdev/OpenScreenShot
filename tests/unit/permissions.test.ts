import { describe, expect, it } from 'vitest';
import {
  classifyMediaError,
  popupWarnings,
  setupComplete,
  siteSettingsUrl,
} from '../../src/shared/permissions';

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
