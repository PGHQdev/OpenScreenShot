/**
 * OpenScreenShot background service worker.
 *
 * Coordinates capture requests from the popup (and keyboard commands) and runs
 * them against the active tab using `activeTab` + `scripting` — no broad host
 * permissions. In-page work (measurement, scrolling, canvas compositing) is done
 * by injecting self-contained functions via `chrome.scripting.executeScript`;
 * the service worker itself only orchestrates and captures viewport tiles with
 * `chrome.tabs.captureVisibleTab`.
 *
 * After a capture completes, the image is stashed in storage, then delivered per
 * the user's capture action: opened in the editor, copied to the clipboard, or
 * downloaded directly.
 */
import type { CaptureMode, CaptureRequest, PopupMessage, TileSpec } from '../shared/types';
import {
  getLastRegion,
  getSettings,
  onSettingsChanged,
  setLastCapture,
  setLastRegion,
  setSettings,
} from '../shared/storage';
import {
  formatFilename,
  isProtectedUrl,
  menuIdToMode,
  MENU_IDS,
  MENU_REPEAT_ID,
  normalizeCaptureAction,
  normalizeCaptureDelay,
} from '../shared/utils';
import { clampRegionRect, computeScrollPositions, MAX_CANVAS_HEIGHT_PX } from '../shared/geometry';
import {
  cropTile,
  getMetrics,
  hideFixedElements,
  prepareCapture,
  restoreCapture,
  scrollToPosition,
  stitchTiles,
} from '../content/scroll-capture';
import { selectRegion } from '../content/region-select';
import { copyImageToClipboard } from '../content/clipboard';
import { restoreRecBadge } from './recording';

const EDITOR_URL = chrome.runtime.getURL('src/editor/index.html');
const POPUP_URL = 'src/popup/index.html';
/** Icon context-menu checkbox that toggles express mode. */
const MENU_EXPRESS_ID = 'oss-express';

/** Minimum gap between `captureVisibleTab` calls — Chrome throttles to ~2/sec. */
const CAPTURE_THROTTLE_MS = 500;
/** Time to let the page paint/composite after each scroll before capturing. */
const PAINT_SETTLE_MS = 60;

// No tab opens on install: the one grant a recording needs is asked for from
// the Record click itself, so first run has nothing to walk through.
chrome.runtime.onInstalled.addListener(() => {
  void createContextMenus();
});

/** Contexts the capture menu appears in — everywhere on a page. */
const MENU_CONTEXTS: NonNullable<chrome.contextMenus.CreateProperties['contexts']> = [
  'page',
  'frame',
  'selection',
  'link',
  'image',
  'video',
  'audio',
];

/**
 * (Re)create the right-click capture menu. Menus persist until update/reload.
 *
 * `onInstalled` can fire twice close together (a reload while a prior
 * install/update event is still being handled), and two runs of this
 * function racing was the cause of a "duplicate id oss-express" error users
 * hit in the wild. `createContextMenusOnce` reads settings *before* clearing
 * the menus so no `await` sits between `removeAll()` and the last `create()`
 * — a competing run can no longer interleave partway through. This wrapper
 * also makes two overlapping calls join a single in-flight run rather than
 * racing at all. That guard is module state and does not survive a service
 * worker restart, so it only protects overlap within one worker lifetime —
 * the reordering above is what actually removes the race, and the swallowed
 * `lastError` on the express `create()` below is the last-resort backstop.
 *
 * Exported only so `tests/unit/context-menus-race.test.ts` can drive it;
 * nothing outside this module calls it.
 */
let createContextMenusPromise: Promise<void> | null = null;

export async function createContextMenus(): Promise<void> {
  if (!createContextMenusPromise) {
    createContextMenusPromise = createContextMenusOnce().finally(() => {
      createContextMenusPromise = null;
    });
  }
  return createContextMenusPromise;
}

async function createContextMenusOnce(): Promise<void> {
  const { expressMode } = await getSettings();
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: 'oss-parent',
    title: 'OpenScreenShot',
    contexts: MENU_CONTEXTS,
  });
  const titles: Record<CaptureMode, string> = {
    'full-page': chrome.i18n.getMessage('modeFullPage'),
    visible: chrome.i18n.getMessage('modeVisible'),
    region: chrome.i18n.getMessage('modeRegion'),
  };
  for (const mode of ['full-page', 'visible', 'region'] as const) {
    chrome.contextMenus.create({
      id: MENU_IDS[mode],
      parentId: 'oss-parent',
      title: titles[mode],
      contexts: MENU_CONTEXTS,
    });
  }
  // Express lives on the icon's right-click menu: once it hijacks the icon
  // click, this checkbox is the only remaining surface that can turn it off.
  chrome.contextMenus.create(
    {
      id: MENU_EXPRESS_ID,
      type: 'checkbox',
      title: chrome.i18n.getMessage('expressLabel'),
      contexts: ['action'],
      checked: expressMode,
    },
    () => void chrome.runtime.lastError,
  );
  await ensureRepeatMenuItem();
}

/**
 * Point the icon click at the popup or (in express mode) straight at a capture.
 * `action.onClicked` only fires while no popup is bound, so the binding is the
 * mode switch. Runs on every worker start and settings change; the menu update
 * fails harmlessly before the checkbox exists (first run before onInstalled).
 */
async function syncExpressMode(): Promise<void> {
  const { expressMode } = await getSettings();
  await chrome.action.setPopup({ popup: expressMode ? '' : POPUP_URL });
  chrome.contextMenus.update(MENU_EXPRESS_ID, { checked: expressMode }, () => {
    void chrome.runtime.lastError;
  });
}

void syncExpressMode();
onSettingsChanged(() => void syncExpressMode());
// The popup binding may revert to the manifest default when the browser
// restarts; this listener guarantees the worker wakes then and re-syncs.
chrome.runtime.onStartup.addListener(() => void syncExpressMode());

// Express mode only: with no popup bound, the icon click grants `activeTab`
// and lands here.
chrome.action.onClicked.addListener(() => {
  void handleCapture('full-page').catch(onCaptureError);
});

/**
 * Add the "repeat last region" item once a region has been stored. The create
 * callback swallows the duplicate-id error on later calls.
 */
async function ensureRepeatMenuItem(): Promise<void> {
  if (!(await getLastRegion())) return;
  chrome.contextMenus.create(
    {
      id: MENU_REPEAT_ID,
      parentId: 'oss-parent',
      title: chrome.i18n.getMessage('repeatLastRegion'),
      contexts: MENU_CONTEXTS,
    },
    () => void chrome.runtime.lastError,
  );
}

// A context menu click grants `activeTab` just like opening the popup does.
chrome.contextMenus.onClicked.addListener((info) => {
  const id = String(info.menuItemId);
  if (id === MENU_EXPRESS_ID) {
    // Chrome already flipped the checkbox; persist the new state. The
    // settings-change listener then rebinds the popup.
    void setSettings({ expressMode: info.checked === true });
    return;
  }
  if (id === MENU_REPEAT_ID) {
    void handleCapture('region', true).catch(onCaptureError);
    return;
  }
  const mode = menuIdToMode(id);
  if (mode) void handleCapture(mode).catch(onCaptureError);
});

chrome.commands.onCommand.addListener((command) => {
  const mode = commandToMode(command);
  if (mode) void handleCapture(mode).catch(onCaptureError);
});

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isCaptureRequest(message)) {
    void handleCapture(message.mode, message.repeat === true).catch(onCaptureError);
  }
  return false; // synchronous: no async sendResponse
});

async function handleCapture(mode: CaptureMode, repeatRegion = false): Promise<void> {
  const tab = await getActiveTab();
  if (!tab || tab.id == null) {
    broadcast({ type: 'CAPTURE_ERROR', code: 'unknown', message: 'No active tab found.' });
    return;
  }
  if (isProtectedUrl(tab.url)) {
    broadcast({
      type: 'CAPTURE_ERROR',
      code: 'protected-page',
      message: "Can't screenshot this protected page.",
    });
    return;
  }
  const delaySeconds = normalizeCaptureDelay((await getSettings()).captureDelay);
  if (delaySeconds > 0) {
    if (countdownActive) return; // one countdown at a time — ignore extra requests
    countdownActive = true;
    try {
      await runCountdown(delaySeconds);
    } finally {
      countdownActive = false;
    }
  }
  switch (mode) {
    case 'visible':
      await captureVisible(tab);
      return;
    case 'full-page':
      await captureFullPage(tab);
      return;
    case 'region':
      await captureRegion(tab, repeatRegion);
      return;
  }
}

let countdownActive = false;

/**
 * Tick the action badge down once per second, then hand the badge back to the
 * recorder (which clears it when nothing is recording). Each `chrome.*` call
 * resets the MV3 idle timer, so a ≤10s countdown can't kill the worker.
 */
async function runCountdown(seconds: number): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#e8503a' });
  await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  for (let s = seconds; s > 0; s--) {
    await chrome.action.setBadgeText({ text: String(s) });
    await delay(1000);
  }
  await restoreRecBadge();
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

/**
 * Inject a self-contained function into `tabId` and return its (awaited) result.
 * Throws if the injection produces no result.
 */
async function execInTab<A extends unknown[], R>(
  tabId: number,
  func: (...args: A) => R,
  args: A,
): Promise<Awaited<R>> {
  const results = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  const result = results?.[0]?.result;
  if (result === undefined) throw new Error('executeScript returned no result');
  return result as Awaited<R>;
}

/** Inject a fire-and-forget (void) function; its undefined result is ignored. */
async function runInTab<A extends unknown[]>(
  tabId: number,
  func: (...args: A) => unknown,
  args: A,
): Promise<void> {
  await chrome.scripting.executeScript({ target: { tabId }, func, args });
}

async function captureVisibleTabPng(windowId: number): Promise<string> {
  return chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
}

async function captureVisible(tab: chrome.tabs.Tab): Promise<void> {
  const tabId = tab.id as number;
  const metrics = await execInTab(tabId, getMetrics, []);
  const windowId = tab.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
  const dataUrl = await captureVisibleTabPng(windowId);
  const width = Math.round(metrics.viewportWidth * metrics.devicePixelRatio);
  const height = Math.round(metrics.viewportHeight * metrics.devicePixelRatio);
  const delivered = await deliverCapture(
    tabId,
    dataUrl,
    width,
    height,
    'visible',
    tab.title ?? '',
    tab.url ?? '',
  );
  if (delivered) broadcast({ type: 'CAPTURE_COMPLETE', imageUrl: dataUrl, width, height });
}

async function captureRegion(tab: chrome.tabs.Tab, repeat = false): Promise<void> {
  const tabId = tab.id as number;
  const metrics = await execInTab(tabId, getMetrics, []);
  let rect;
  if (repeat) {
    const stored = await getLastRegion();
    rect = stored && clampRegionRect(stored, metrics.viewportWidth, metrics.viewportHeight);
    if (!rect) {
      broadcast({
        type: 'CAPTURE_ERROR',
        code: 'no-region',
        message: 'No saved region fits this screen — select one first.',
      });
      return;
    }
  } else {
    rect = await execInTab(tabId, selectRegion, []);
    if (!rect) return; // user pressed Esc — nothing to capture
    await setLastRegion(rect);
    await ensureRepeatMenuItem();
  }
  const windowId = tab.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
  const tile = await captureVisibleTabPng(windowId);
  const dpr = metrics.devicePixelRatio;
  const x = Math.round(rect.x * dpr);
  const y = Math.round(rect.y * dpr);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  const dataUrl = await execInTab(tabId, cropTile, [tile, x, y, w, h]);
  const delivered = await deliverCapture(
    tabId,
    dataUrl,
    w,
    h,
    'region',
    tab.title ?? '',
    tab.url ?? '',
  );
  if (delivered) broadcast({ type: 'CAPTURE_COMPLETE', imageUrl: dataUrl, width: w, height: h });
}

async function captureFullPage(tab: chrome.tabs.Tab): Promise<void> {
  const tabId = tab.id as number;
  const metrics = await execInTab(tabId, getMetrics, []);
  if (metrics.viewportHeight <= 0 || metrics.scrollHeight <= 0) {
    broadcast({
      type: 'CAPTURE_ERROR',
      code: 'blank-page',
      message: 'This page has no scrollable content.',
    });
    return;
  }
  const dpr = metrics.devicePixelRatio;
  const canvasHeight = Math.round(metrics.scrollHeight * dpr);
  if (canvasHeight > MAX_CANVAS_HEIGHT_PX) {
    broadcast({
      type: 'CAPTURE_ERROR',
      code: 'too-large',
      message: `This page is too tall to capture in one image (${canvasHeight}px). Try visible or region mode.`,
    });
    return;
  }

  const positions = computeScrollPositions(metrics.scrollHeight, metrics.viewportHeight);
  const windowId = tab.windowId ?? chrome.windows.WINDOW_ID_CURRENT;
  // When an inner element scrolls, crop each viewport tile to its rect (device px).
  const crop = metrics.container
    ? {
        x: Math.round(metrics.container.x * dpr),
        y: Math.round(metrics.container.y * dpr),
        w: Math.round(metrics.container.width * dpr),
        h: Math.round(metrics.container.height * dpr),
      }
    : null;
  const canvasWidth = crop ? crop.w : Math.round(metrics.viewportWidth * dpr);

  // Disable smooth scrolling (but keep fixed elements visible) for the first tile.
  await runInTab(tabId, prepareCapture, []);
  const tiles: TileSpec[] = [];
  try {
    // Tile 0: capture at the top with fixed elements visible so a fixed header
    // appears once at the top of the final image (instead of being omitted).
    {
      await execInTab(tabId, scrollToPosition, [positions[0]]);
      await delay(PAINT_SETTLE_MS);
      const first = await captureVisibleTabPng(windowId);
      tiles.push({ dataUrl: first, y: 0 });
      broadcast({ type: 'CAPTURE_PROGRESS', percent: Math.round((1 / positions.length) * 100) });
    }
    // Remaining tiles: hide fixed elements so they don't duplicate.
    if (positions.length > 1) {
      await runInTab(tabId, hideFixedElements, []);
      for (let i = 1; i < positions.length; i++) {
        await delay(CAPTURE_THROTTLE_MS);
        const { scrollY } = await execInTab(tabId, scrollToPosition, [positions[i]]);
        await delay(PAINT_SETTLE_MS);
        const dataUrl = await captureVisibleTabPng(windowId);
        tiles.push({ dataUrl, y: Math.round(scrollY * dpr) });
        broadcast({
          type: 'CAPTURE_PROGRESS',
          percent: Math.round(((i + 1) / positions.length) * 100),
        });
      }
    }
  } finally {
    await runInTab(tabId, restoreCapture, []);
  }

  const dataUrl = await execInTab(tabId, stitchTiles, [tiles, canvasWidth, canvasHeight, crop]);
  const delivered = await deliverCapture(
    tabId,
    dataUrl,
    canvasWidth,
    canvasHeight,
    'full-page',
    tab.title ?? '',
    tab.url ?? '',
  );
  if (delivered) {
    broadcast({
      type: 'CAPTURE_COMPLETE',
      imageUrl: dataUrl,
      width: canvasWidth,
      height: canvasHeight,
    });
  }
}

/**
 * Deliver a finished capture the way the user asked for. Every path stashes the
 * capture first, so the popup's "Reopen last" link still works after a quick
 * capture. Settings are read here rather than passed down: a full-page capture
 * can take seconds, and the newest value is the one the user meant.
 *
 * Returns whether delivery actually happened — callers broadcast `CAPTURE_COMPLETE`
 * only on `true`, so a failed clipboard copy doesn't chase its own `CAPTURE_ERROR`
 * with a completion message (the popup closes itself on `CAPTURE_COMPLETE`).
 */
async function deliverCapture(
  tabId: number,
  dataUrl: string,
  width: number,
  height: number,
  mode: CaptureMode,
  title: string,
  url: string,
): Promise<boolean> {
  await setLastCapture({ dataUrl, width, height, mode, title, url, capturedAt: Date.now() });
  const settings = await getSettings();
  const action = normalizeCaptureAction(settings.captureAction);

  if (action === 'editor') {
    await chrome.tabs.create({ url: EDITOR_URL });
    return true;
  }

  if (action === 'clipboard') {
    const copied = await execInTab(tabId, copyImageToClipboard, [dataUrl]);
    if (!copied) {
      broadcast({
        type: 'CAPTURE_ERROR',
        code: 'quick-action',
        message: 'Could not copy the screenshot to the clipboard.',
      });
      return false;
    }
    void flashDoneBadge();
    return true;
  }

  // Quick save writes PNG: the capture already is one, and the export dialog
  // owns the format choice.
  const base = formatFilename(settings.filenameTemplate, { title, url, width, height });
  try {
    await chrome.downloads.download({ url: dataUrl, filename: `${base}.png`, saveAs: false });
  } catch {
    broadcast({
      type: 'CAPTURE_ERROR',
      code: 'quick-action',
      message: 'Could not save the screenshot to disk.',
    });
    return false;
  }
  void flashDoneBadge();
  return true;
}

function commandToMode(command: string): CaptureMode | null {
  switch (command) {
    case 'capture-full-page':
      return 'full-page';
    case 'capture-visible':
      return 'visible';
    case 'capture-region':
      return 'region';
    default:
      return null;
  }
}

function onCaptureError(err: unknown): void {
  console.error('[OpenScreenShot] capture failed', err);
  broadcast({ type: 'CAPTURE_ERROR', code: 'unknown', message: 'Capture failed unexpectedly.' });
}

function broadcast(msg: PopupMessage): void {
  // Context menu and delayed captures have no popup to show a toast in, so
  // errors also flash the action badge.
  if (msg.type === 'CAPTURE_ERROR') void flashErrorBadge();
  // The popup may already be closed (e.g. region mode); ignore delivery failures.
  void chrome.runtime.sendMessage(msg).catch(() => {
    /* popup not listening */
  });
}

async function flashErrorBadge(): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#e8503a' });
  await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  await chrome.action.setBadgeText({ text: '!' });
  await delay(4000);
  await restoreRecBadge();
}

/** A quick capture opens no tab, so the badge is the only place to report success. */
async function flashDoneBadge(): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#34c759' });
  await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  await chrome.action.setBadgeText({ text: '✓' });
  await delay(1200);
  await restoreRecBadge();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCaptureRequest(m: unknown): m is CaptureRequest {
  return (
    !!m &&
    typeof m === 'object' &&
    (m as { type?: string }).type === 'CAPTURE_REQUEST' &&
    'mode' in m
  );
}
