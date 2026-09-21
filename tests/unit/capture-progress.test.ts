import { beforeEach, expect, it, vi } from 'vitest';

let api: typeof import('../../src/background/capture-progress');
let windows: {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
beforeEach(async () => {
  vi.resetModules();
  windows = {
    create: vi.fn(async () => ({ id: 9 })),
    get: vi.fn(async (id: number) => ({ id, left: 100, top: 200, width: 1200, height: 800 })),
    remove: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
  };
  vi.stubGlobal('chrome', {
    windows,
    runtime: { getURL: (s: string) => s, sendMessage: vi.fn(async () => {}) },
  });
  api = await import('../../src/background/capture-progress');
});
it('centers a focused window over the source browser window', async () => {
  await api.openCaptureProgress(1);
  expect(windows.create).toHaveBeenCalledWith(
    expect.objectContaining({ left: 520, top: 505, focused: true }),
  );
});
it('keeps the result ready for an explicit editor handoff', async () => {
  await api.openCaptureProgress(1);
  expect(await api.finishCaptureProgress('editor', 1)).toBe(true);
  expect(api.getCaptureProgress()).toEqual({ percent: 100, result: 'editor', sourceWindowId: 1 });
  expect(windows.remove).not.toHaveBeenCalled();
});
it('falls back to normal delivery when the user closed the window', async () => {
  await api.openCaptureProgress(1);
  windows.get.mockRejectedValueOnce(new Error('closed'));
  expect(await api.finishCaptureProgress('editor', 1)).toBe(false);
});
it('does not prevent capture when window creation is blocked', async () => {
  windows.create.mockRejectedValueOnce(new Error('blocked'));
  await api.openCaptureProgress(1);
  expect(await api.finishCaptureProgress('editor', 1)).toBe(false);
});
it('can show saved and copied confirmations', async () => {
  await api.openCaptureProgress(1);
  await api.finishCaptureProgress('clipboard', 1);
  expect(api.getCaptureProgress()?.result).toBe('clipboard');
  await api.closeCaptureProgress();
  expect(windows.remove).toHaveBeenCalledWith(9);
  expect(api.getCaptureProgress()).toBeNull();
});

it('retains ready state while the window listener is still loading', async () => {
  await api.openCaptureProgress(1);
  vi.mocked(chrome.runtime.sendMessage).mockRejectedValueOnce(new Error('No receiver'));
  expect(await api.finishCaptureProgress('editor', 1)).toBe(true);
  expect(api.getCaptureProgress()?.result).toBe('editor');
});

it('binds ready actions to the specific stored screenshot', async () => {
  await api.openCaptureProgress(1);
  await api.finishCaptureProgress('editor', 1, 'capture-original');
  expect(api.getCaptureProgress()?.captureId).toBe('capture-original');
});
