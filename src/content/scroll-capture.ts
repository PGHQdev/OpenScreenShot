/**
 * Page-context functions injected on demand via `chrome.scripting.executeScript`.
 *
 * IMPORTANT: every exported function here must be FULLY SELF-CONTAINED. When
 * injected with `{ func }`, Chrome serializes the function via `toString()` and
 * discards its closure — so no references to module-scope bindings are allowed
 * (only the function's own parameters and page-context globals like `document`,
 * `window`, `Image`, `getComputedStyle`). Helper code is therefore nested inside
 * each function that needs it. The functions are bundled into the service worker
 * (as part of its import graph) but are only ever *stringified* there, never
 * executed — so referencing DOM globals is safe at the type level and harmless at
 * runtime.
 */
import type { Metrics, TileSpec } from '../shared/types';

/** Visible, region, and element captures use window coordinates, even in inner scroll panels. */
export function getWindowViewport() {
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Measure the page so the background can plan the scroll loop + canvas size.
 *
 * When an inner element scrolls further than the document (common in SPAs and
 * dashboards like Gmail, Claude, Notion — the body is pinned, or only a footer
 * overflows it), find that element, tag it `data-oss-scroller`, and report ITS
 * geometry + viewport rect so the capture loop scrolls it and crops each tile to it.
 *
 * Smaller scroll boxes inside the captured region (code blocks, tables, panel
 * widgets) are expanded to their full content height and tagged
 * `data-oss-expanded`, so the capture holds them whole. {@link restoreCapture}
 * puts them back.
 */
export function getMetrics(excludeScrollbars = false, scrollTarget = false): Metrics {
  const de = document.documentElement;
  // The element picker's "Capture whole scrolling area" tags the box to scroll.
  // Only that capture uses the tag; any other capture clears a stale one.
  const tagged = document.querySelector<HTMLElement>('[data-oss-scroll-target]');
  if (tagged && !scrollTarget) tagged.removeAttribute('data-oss-scroll-target');
  const forced = scrollTarget ? tagged : null;
  const dpr = window.devicePixelRatio || 1;
  // client dimensions exclude classic scrollbar gutters without reflowing
  // the page. Overlay scrollbars are made transparent during preparation.
  const measureViewport = () => {
    const viewport = document.compatMode === 'BackCompat' ? document.body : de;
    return {
      vw: excludeScrollbars
        ? Math.min(window.innerWidth, viewport?.clientWidth || window.innerWidth)
        : window.innerWidth,
      vh: excludeScrollbars
        ? Math.min(window.innerHeight, viewport?.clientHeight || window.innerHeight)
        : window.innerHeight,
      vl: excludeScrollbars ? (viewport?.clientLeft ?? 0) : 0,
    };
  };
  let { vw, vh, vl } = measureViewport();
  // A pinned body (overflow hidden) cannot scroll, so expanded boxes would fall off-screen.
  const documentScrolls = ![de, document.body].some(
    (el) => el && /^(hidden|clip)$/.test(getComputedStyle(el).overflowY),
  );

  // Pick the element with the most vertical overflow that also covers most of
  // the viewport — the dominant scroll region. It must outscroll the document.
  // When the document can grow, a panel that overflows by less than half a
  // viewport is expanded in place instead, which keeps the page around it.
  // ponytail: linear DOM scan, fine for a one-shot capture; index by overflow if it ever matters.
  let scroller: HTMLElement | null = forced;
  let bestOverflow = Math.max(documentScrolls ? vh * 0.5 : 4, de.scrollHeight - vh);
  for (const el of forced ? [] : document.querySelectorAll<HTMLElement>('*')) {
    const cs = getComputedStyle(el);
    if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') continue;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow <= bestOverflow) continue;
    const r = el.getBoundingClientRect();
    if (r.width < vw * 0.5 || r.height < vh * 0.5) continue;
    // Tiles are cropped to this rect, so it must sit inside the viewport.
    if (r.left < vl - 1 || r.top < -1 || r.right > vl + vw + 1 || r.bottom > vh + 1) continue;
    bestOverflow = overflow;
    scroller = el;
  }

  const root = scroller ?? de;
  if (scroller || documentScrolls) {
    for (const el of root.querySelectorAll<HTMLElement>('*')) {
      if (el === document.body || el.dataset.ossExpanded !== undefined) continue;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') continue;
      const cs = getComputedStyle(el);
      if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') continue;
      if (el.clientHeight === 0 || el.scrollHeight - el.clientHeight <= 4) continue;
      // A fixed or sticky panel, such as a docs sidebar, would add blank space below the page.
      const ancestors: HTMLElement[] = [];
      let pinned = false;
      for (let a: HTMLElement | null = el; a && a !== root; a = a.parentElement) {
        if (/^(fixed|sticky)$/.test(getComputedStyle(a).position)) pinned = true;
        if (a !== el) ancestors.push(a);
      }
      if (pinned) continue;
      // A virtual list renders only the rows in view; expanded, it shows blank rows.
      if (el.childElementCount) {
        const top = el.getBoundingClientRect().top + el.clientTop - el.scrollTop;
        let contentBottom = 0;
        for (const leaf of el.querySelectorAll('*')) {
          if (leaf.childElementCount) continue;
          const r = leaf.getBoundingClientRect();
          if (r.width && r.height) contentBottom = Math.max(contentBottom, r.bottom - top);
        }
        if (el.scrollHeight - contentBottom > el.clientHeight / 2) continue;
      }

      const before = ancestors.map((a) => ({ height: a.clientHeight, overflow: a.scrollHeight }));
      const style = el.getAttribute('style');
      el.dataset.ossExpanded = String(el.scrollTop);
      if (style !== null) el.dataset.ossStyle = style;
      el.style.setProperty('height', 'auto', 'important');
      el.style.setProperty('max-height', 'none', 'important');
      // Flex or grid sizing can keep the box short. A parent that does not grow
      // with it clips the box, or lets it spill over the content below.
      let fits = el.scrollHeight - el.clientHeight <= 4;
      for (let i = 0; fits && i < ancestors.length; i++) {
        const a = ancestors[i];
        if (a.clientHeight > before[i].height || a.scrollHeight <= before[i].overflow) continue;
        if (getComputedStyle(a).overflowY !== 'visible') fits = false;
        for (let s = a.nextElementSibling; fits && s; s = s.nextElementSibling)
          if (s.getBoundingClientRect().height > 0) fits = false;
      }
      if (!fits) {
        if (style === null) el.removeAttribute('style');
        else el.setAttribute('style', style);
        el.scrollTop = Number(el.dataset.ossExpanded);
        delete el.dataset.ossExpanded;
        delete el.dataset.ossStyle;
      }
    }
  }

  if (scroller) {
    scroller.dataset.ossScroller = '1';
    const r = scroller.getBoundingClientRect();
    return {
      scrollHeight: scroller.scrollHeight,
      viewportHeight: scroller.clientHeight,
      viewportWidth: scroller.clientWidth,
      devicePixelRatio: dpr,
      container: {
        x: r.left + scroller.clientLeft,
        y: r.top + scroller.clientTop,
        width: scroller.clientWidth,
        height: scroller.clientHeight,
      },
    };
  }

  // Expansion can add a document scrollbar, which narrows the viewport.
  ({ vw, vh, vl } = measureViewport());
  return {
    viewportLeft: vl,
    scrollHeight: de.scrollHeight,
    viewportHeight: vh,
    viewportWidth: vw,
    devicePixelRatio: dpr,
    container: null,
  };
}

/**
 * Disable smooth scrolling so capture scrolls are instant. Fixed/sticky
 * elements are NOT hidden here — the first tile is captured with them visible
 * (so a fixed header appears once at the top) and {@link hideFixedElements}
 * hides them for the remaining tiles.
 */
export function prepareCapture(): void {
  const win = window as Window & {
    __ossCaptureState?: {
      style: HTMLStyleElement;
      positions: Array<{ el: HTMLElement; left: number; top: number }>;
      behavior: Array<{ el: HTMLElement; value: string; priority: string }>;
      colors: Array<{ el: HTMLElement; value: string; priority: string }>;
    };
  };
  if (win.__ossCaptureState) return;
  const root = document.documentElement;
  const scroller = document.querySelector<HTMLElement>('[data-oss-scroller="1"]');
  const scrollRoot = (document.scrollingElement as HTMLElement | null) ?? root;
  const elements = [...new Set([root, scrollRoot, ...(scroller ? [scroller] : [])])];
  // Chromium's standard scrollbar-color takes precedence over WebKit rules.
  // Only override elements already using it, avoiding a switch of scrollbar
  // styling systems (which can change custom scrollbar dimensions).
  const colored = [...document.querySelectorAll<HTMLElement>('*')].filter((el) => {
    if (el !== root && el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)
      return false;
    const color = getComputedStyle(el).getPropertyValue('scrollbar-color');
    return color !== '' && color !== 'auto';
  });
  const style = document.createElement('style');
  // Preserve scrollbar width/gutters: display:none or scrollbar-width:none
  // would reflow text and invalidate the measured capture geometry.
  style.textContent = `
    @supports not selector(::-webkit-scrollbar) {
      * { scrollbar-color: transparent transparent !important; }
    }
    * { scroll-snap-type: none !important; overflow-anchor: none !important;
        animation-play-state: paused !important; transition: none !important;
        caret-color: transparent !important; }
    *::-webkit-scrollbar, *::-webkit-scrollbar-thumb,
    *::-webkit-scrollbar-track, *::-webkit-scrollbar-track-piece,
    *::-webkit-scrollbar-button, *::-webkit-scrollbar-corner {
      background: transparent !important; border-color: transparent !important;
      box-shadow: none !important; visibility: hidden !important;
    }
  `;
  win.__ossCaptureState = {
    style,
    colors: colored.map((el) => ({
      el,
      value: el.style.getPropertyValue('scrollbar-color'),
      priority: el.style.getPropertyPriority('scrollbar-color'),
    })),
    positions: elements.map((el) => ({ el, left: el.scrollLeft, top: el.scrollTop })),
    behavior: elements.map((el) => ({
      el,
      value: el.style.getPropertyValue('scroll-behavior'),
      priority: el.style.getPropertyPriority('scroll-behavior'),
    })),
  };
  root.append(style);
  for (const el of colored)
    el.style.setProperty('scrollbar-color', 'transparent transparent', 'important');
  for (const el of elements) el.style.setProperty('scroll-behavior', 'auto', 'important');
}

/**
 * Hide fixed/sticky elements so they don't duplicate across tiles. Hidden
 * elements are tagged with a `data-oss-hidden` attribute so
 * {@link restoreCapture} can find them again.
 */
export function hideFixedElements(): void {
  const scroller = document.querySelector('[data-oss-scroller="1"]');
  const els = document.querySelectorAll('*');
  for (const el of els) {
    if (el.hasAttribute('data-oss-capture-overlay')) continue;
    // A fixed app shell holds the scroller; hiding it would blank every later tile.
    if (scroller && el.contains(scroller)) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'sticky') {
      if (el.hasAttribute('data-oss-hidden')) continue;
      (el as HTMLElement).dataset.ossVisibility = (el as HTMLElement).style.getPropertyValue(
        'visibility',
      );
      (el as HTMLElement).dataset.ossVisibilityPriority = (
        el as HTMLElement
      ).style.getPropertyPriority('visibility');
      (el as HTMLElement).dataset.ossHidden = '1';
      (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
    }
  }
}

/**
 * Scroll to `y` and report where we actually landed (may be clamped at the
 * bottom). Scrolls the tagged inner container if present, else the window.
 */
export function scrollToPosition(y: number): { scrollY: number; atBottom: boolean } {
  const scroller = document.querySelector<HTMLElement>('[data-oss-scroller="1"]');
  if (scroller) {
    scroller.scrollTop = y;
    const after = scroller.scrollTop;
    const max = scroller.scrollHeight - scroller.clientHeight;
    return { scrollY: after, atBottom: after >= max - 1 };
  }
  window.scrollTo(0, y);
  const after = window.scrollY;
  const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  return { scrollY: after, atBottom: after >= max - 1 };
}

/** Restore the page to its pre-capture state. */
export function restoreCapture(): void {
  // Shrink expanded boxes first, so the scroll positions below land where they were.
  for (const el of document.querySelectorAll<HTMLElement>('[data-oss-expanded]')) {
    if (el.dataset.ossStyle === undefined) el.removeAttribute('style');
    else el.setAttribute('style', el.dataset.ossStyle);
    el.scrollTop = Number(el.dataset.ossExpanded);
    delete el.dataset.ossExpanded;
    delete el.dataset.ossStyle;
  }
  const hidden = document.querySelectorAll('[data-oss-hidden="1"]');
  for (const el of hidden) {
    const node = el as HTMLElement;
    if (node.dataset.ossVisibility)
      node.style.setProperty(
        'visibility',
        node.dataset.ossVisibility,
        node.dataset.ossVisibilityPriority || '',
      );
    else node.style.removeProperty('visibility');
    delete node.dataset.ossVisibility;
    delete node.dataset.ossVisibilityPriority;
    delete (el as HTMLElement).dataset.ossHidden;
  }
  const win = window as Window & {
    __ossCaptureState?: {
      style: HTMLStyleElement;
      positions: Array<{ el: HTMLElement; left: number; top: number }>;
      behavior: Array<{ el: HTMLElement; value: string; priority: string }>;
      colors: Array<{ el: HTMLElement; value: string; priority: string }>;
    };
  };
  const state = win.__ossCaptureState;
  if (state) {
    // Restore position while smooth scrolling and scroll snapping are disabled.
    for (const { el, left, top } of state.positions) {
      el.scrollLeft = left;
      el.scrollTop = top;
    }
    for (const { el, value, priority } of state.behavior) {
      if (value) el.style.setProperty('scroll-behavior', value, priority);
      else el.style.removeProperty('scroll-behavior');
    }
    for (const { el, value, priority } of state.colors) {
      if (value) el.style.setProperty('scrollbar-color', value, priority);
      else el.style.removeProperty('scrollbar-color');
    }
    state.style.remove();
    delete win.__ossCaptureState;
  }
  const scroller = document.querySelector<HTMLElement>('[data-oss-scroller="1"]');
  if (scroller) delete scroller.dataset.ossScroller;
  document.querySelector('[data-oss-scroll-target]')?.removeAttribute('data-oss-scroll-target');
}

/**
 * Composite every tile onto a single canvas sized `width`×`height` (device px) and
 * return the result as a PNG data URL. Each tile is drawn at its vertical device
 * offset; overlapping tiles overwrite identical content, so no seams appear.
 */
export async function stitchTiles(
  tiles: TileSpec[],
  width: number,
  height: number,
  crop: { x: number; y: number; w: number; h: number } | null,
): Promise<string> {
  const load = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('tile load failed'));
      img.src = src;
    });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  for (const tile of tiles) {
    const img = await load(tile.dataUrl);
    if (crop) {
      // Inner-container capture: take only the container's slice of the viewport.
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, tile.y, crop.w, crop.h);
    } else {
      ctx.drawImage(img, 0, tile.y, img.naturalWidth, img.naturalHeight);
    }
  }
  return canvas.toDataURL('image/png');
}

/**
 * Crop a viewport capture (`dataUrl`, device px) to the given rectangle (device px)
 * and return the cropped PNG data URL. Used by region capture.
 */
export async function cropTile(
  dataUrl: string,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<string> {
  const load = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('tile load failed'));
      img.src = src;
    });
  const img = await load(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
