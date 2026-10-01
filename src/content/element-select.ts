import type { PageRect } from '../shared/types';

export interface ElementPickerLabels {
  title: string;
  instructions: string;
  empty: string;
  clipped: string;
  capture: string;
  fullPage: string;
  cancel: string;
  larger: string;
  smaller: string;
}

export type ElementSelection = { kind: 'element'; rect: PageRect } | { kind: 'full-page' };

/** Injected with executeScript: all runtime helpers must stay inside this function. */
export function selectElement(labels: ElementPickerLabels): Promise<ElementSelection | null> {
  return new Promise((resolve) => {
    const doc = document;
    const marker = 'data-openscreenshot-element-picker';
    // A DOM event also works across separately serialized invocations.
    doc.querySelector(`[${marker}]`)?.dispatchEvent(new Event('openscreenshot-cancel'));
    let active = doc.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    const priorFocus = active instanceof HTMLElement ? active : null;
    const host = doc.createElement('div');
    host.setAttribute(marker, '');
    for (const [property, value] of Object.entries({
      all: 'initial',
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      margin: '0',
      padding: '0',
      border: '0',
      'max-width': 'none',
      'max-height': 'none',
      'z-index': '2147483647',
      overflow: 'hidden',
      background: 'transparent',
      visibility: 'visible',
      display: 'block',
      'pointer-events': 'auto',
      transform: 'none',
      opacity: '1',
      'color-scheme': 'dark',
    }))
      host.style.setProperty(property, value, 'important');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = doc.createElement('style');
    style.textContent = `
      :host{all:initial} *{box-sizing:border-box}
      .layer{position:absolute;inset:0;cursor:crosshair}
      .selection{position:absolute;pointer-events:none;border:2px dashed #000;
        outline:1px solid #fff;outline-offset:1px;box-shadow:0 0 0 99999px #0007}
      .shade{position:absolute;inset:0;background:#0007;pointer-events:none}
      .bar{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);
        width:max-content;max-width:calc(100% - 24px);max-height:calc(100% - 24px);
        overflow:auto;background:#202124;color:#fff;border:1px solid #777;
        border-radius:12px;padding:12px 16px;font:13px/1.5 system-ui,sans-serif;
        box-shadow:0 4px 20px #0006;cursor:default}
      h2{font:600 15px/1.4 system-ui,sans-serif;margin:0 0 4px}
      p{margin:3px 0;white-space:normal} .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
      button{font:600 13px/1.4 system-ui,sans-serif;border:1px solid #858585;border-radius:6px;
        padding:8px 12px;background:#303134;color:#fff;cursor:pointer;min-height:36px}
      button.primary{background:#a8c7fa;color:#062e6f;border-color:#a8c7fa}
      button:disabled{opacity:.5;cursor:default} button:focus-visible,.bar:focus-visible{outline:3px solid #a8c7fa;outline-offset:3px}
      [hidden]{display:none!important}
    `;
    const layer = doc.createElement('div');
    layer.className = 'layer';
    const shade = doc.createElement('div');
    shade.className = 'shade';
    const selection = doc.createElement('div');
    selection.className = 'selection';
    selection.setAttribute('data-selection', '');
    selection.hidden = true;
    const bar = doc.createElement('div');
    bar.className = 'bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-modal', 'true');
    bar.setAttribute('aria-label', labels.title);
    bar.tabIndex = -1;
    const title = doc.createElement('h2');
    title.textContent = labels.title;
    const instructions = doc.createElement('p');
    instructions.id = 'instructions';
    instructions.textContent = labels.instructions;
    bar.setAttribute('aria-describedby', instructions.id);
    const status = doc.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const actions = doc.createElement('div');
    actions.className = 'actions';
    const button = (text: string) => {
      const el = doc.createElement('button');
      el.type = 'button';
      el.textContent = text;
      actions.append(el);
      return el;
    };
    const larger = button(labels.larger);
    const smaller = button(labels.smaller);
    const capture = button(labels.capture);
    capture.className = 'primary';
    const fullPage = button(labels.fullPage);
    const cancel = button(labels.cancel);
    bar.append(title, instructions, status, actions);
    shadow.append(style, layer, shade, selection, bar);

    let current: Element | null = null;
    let history: Element[] = [];
    let hoveredHit: Element | null = null;
    let smallerTarget: Element | null = null;
    let pointer: { x: number; y: number } | null = null;
    let pinnedPointer: { x: number; y: number } | null = null;
    let done = false;
    let frame = 0;
    const parent = (el: Element): Element | null =>
      el.parentElement ??
      (el.getRootNode() instanceof ShadowRoot ? (el.getRootNode() as ShadowRoot).host : null);
    const usable = (el: Element) => {
      if (!el.isConnected || el === host || el === doc.body || el === doc.documentElement)
        return false;
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return (
        rect.width >= 2 &&
        rect.height >= 2 &&
        css.visibility === 'visible' &&
        css.display !== 'none' &&
        css.opacity !== '0'
      );
    };
    const meaningful = (el: Element) => {
      if (!usable(el)) return false;
      if (
        el.matches(
          'img,svg,canvas,video,iframe,table,article,section,figure,[role="img"],[role="table"],[role="grid"]',
        )
      )
        return true;
      const css = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        rect.width >= 48 &&
        rect.height >= 32 &&
        css.display !== 'inline' &&
        (css.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          css.boxShadow !== 'none' ||
          parseFloat(css.borderRadius) > 0)
      );
    };
    const preferred = (target: Element | null) => {
      let fallback: Element | null = null;
      for (let el = target; el && el !== doc.body && el !== doc.documentElement; el = parent(el)) {
        if (meaningful(el)) return el;
        if (
          !fallback &&
          usable(el) &&
          !['inline', 'contents'].includes(getComputedStyle(el).display)
        ) {
          const r = el.getBoundingClientRect();
          if (r.width >= 32 && r.height >= 24) fallback = el;
        }
      }
      return fallback;
    };
    const ancestor = (target: Element | null) => {
      for (let el = target ? parent(target) : null; el; el = parent(el)) {
        if (usable(el)) return el;
      }
      return null;
    };
    const findSmaller = (): Element | null => {
      if (!current) return null;
      const bounds = current.getBoundingClientRect();
      const eligible = (el: Element) => {
        if (!usable(el)) return false;
        const rect = el.getBoundingClientRect();
        const block = !['inline', 'contents'].includes(getComputedStyle(el).display);
        return (
          (meaningful(el) || (block && rect.width >= 32 && rect.height >= 24)) &&
          rect.width <= bounds.width &&
          rect.height <= bounds.height &&
          (rect.width < bounds.width || rect.height < bounds.height)
        );
      };
      // Descend one eligible level along the hover path, including open shadow roots.
      const path: Element[] = [];
      let node = hoveredHit;
      while (node && node !== current) {
        path.push(node);
        node = parent(node);
      }
      if (node === current) {
        const hit = path.reverse().find(eligible);
        if (hit) return hit;
      }
      // Search only on selection/hover changes or explicit ↓, never in the repaint loop.
      const children = (el: Element) => Array.from(el.shadowRoot?.children ?? el.children);
      const queue = children(current);
      for (let index = 0; index < queue.length && index < 2000; index++) {
        const child = queue[index];
        if (eligible(child)) return child;
        queue.push(...children(child).slice(0, Math.max(0, 2000 - queue.length)));
      }
      return null;
    };
    const fullyVisible = (el: Element, rect: DOMRect) => {
      const visual = window.visualViewport;
      const gutter = doc.compatMode === 'BackCompat' ? doc.body : doc.documentElement;
      const left = Math.max(gutter.clientLeft, visual?.offsetLeft ?? 0);
      const top = visual?.offsetTop ?? 0;
      const right = Math.min(
        gutter.clientLeft + Math.min(innerWidth, gutter.clientWidth || innerWidth),
        (visual?.offsetLeft ?? 0) + (visual?.width ?? innerWidth),
      );
      const bottom = Math.min(
        innerHeight,
        gutter.clientHeight || innerHeight,
        top + (visual?.height ?? innerHeight),
      );
      if (rect.left < left || rect.top < top || rect.right > right || rect.bottom > bottom)
        return false;
      for (let node: Element | null = el; node; node = parent(node)) {
        const css = getComputedStyle(node);
        if (css.visibility !== 'visible' || css.opacity === '0' || css.clipPath !== 'none')
          return false;
        if (node === el) continue;
        const bounds = node.getBoundingClientRect();
        const xClipped = /hidden|clip|scroll|auto/.test(css.overflowX);
        const yClipped = /hidden|clip|scroll|auto/.test(css.overflowY);
        // Scale client bounds along with transformed containers.
        const sx =
          node instanceof HTMLElement && node.offsetWidth ? bounds.width / node.offsetWidth : 1;
        const sy =
          node instanceof HTMLElement && node.offsetHeight ? bounds.height / node.offsetHeight : 1;
        const x = bounds.left + node.clientLeft * sx;
        const y = bounds.top + node.clientTop * sy;
        if (
          (xClipped && (rect.left < x || rect.right > x + node.clientWidth * sx)) ||
          (yClipped && (rect.top < y || rect.bottom > y + node.clientHeight * sy))
        )
          return false;
      }
      return true;
    };
    const render = () => {
      if (current && !usable(current)) {
        current = null;
        history = [];
        smallerTarget = null;
      }
      const rect = current?.getBoundingClientRect();
      const visible = !!(current && rect && fullyVisible(current, rect));
      selection.hidden = !rect;
      shade.hidden = !!rect;
      if (rect) {
        Object.assign(selection.style, {
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });
      }
      capture.disabled = !visible;
      fullPage.hidden = !current || visible;
      larger.disabled = !ancestor(current);
      smaller.disabled = !history.some(usable) && !(smallerTarget && usable(smallerTarget));
      const text =
        current && rect
          ? `${Math.round(rect.width)} × ${Math.round(rect.height)}${visible ? '' : ` — ${labels.clipped}`}`
          : labels.empty;
      if (status.textContent !== text) status.textContent = text;
      return visible && rect
        ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        : null;
    };
    const finish = (value: ElementSelection | null) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointermove', onMove, true);
      for (const name of [
        'pointerdown',
        'pointerup',
        'mousedown',
        'mouseup',
        'click',
        'dblclick',
        'auxclick',
        'contextmenu',
        'touchstart',
        'touchend',
      ]) {
        window.removeEventListener(name, onInteraction, true);
      }
      window.removeEventListener('pagehide', onPageHide);
      host.removeEventListener('openscreenshot-cancel', onCancel);
      host.remove();
      if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
      // The caller may immediately captureVisibleTab: wait until our pixels are gone.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(value)));
    };
    const confirm = () => {
      const rect = render();
      if (rect) finish({ kind: 'element', rect });
    };
    const grow = () => {
      const next = ancestor(current);
      if (current && next) {
        history.push(current);
        current = next;
        smallerTarget = findSmaller();
        pinnedPointer = pointer;
        render();
      }
    };
    const shrink = () => {
      let next = history.pop();
      while (next && !usable(next)) next = history.pop();
      const descendant = next ?? findSmaller();
      if (descendant) {
        current = descendant;
        smallerTarget = findSmaller();
        pinnedPointer = pointer;
        render();
      }
    };
    const chooseAt = (x: number, y: number) => {
      host.style.setProperty('visibility', 'hidden', 'important');
      let hit = doc.elementFromPoint(x, y);
      while (hit?.shadowRoot) {
        const deeper = hit.shadowRoot.elementFromPoint(x, y);
        if (!deeper || deeper === hit) break;
        hit = deeper;
      }
      host.style.setProperty('visibility', 'visible', 'important');
      const next = preferred(hit);
      const changed = next !== current || hoveredHit !== hit;
      hoveredHit = hit;
      if (next !== current) {
        current = next;
        history = [];
      }
      if (changed) smallerTarget = findSmaller();
      render();
    };
    const navigate = (direction: number) => {
      const found = new Set<Element>();
      const scan = (root: Document | ShadowRoot) => {
        // Bound work on enormous pages; open shadow trees participate normally.
        for (const el of Array.from(root.querySelectorAll('*')).slice(0, 5000)) {
          if (el === host) continue;
          if (usable(el)) {
            const rect = el.getBoundingClientRect();
            if (
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < innerHeight &&
              rect.left < innerWidth
            ) {
              const candidate = preferred(el);
              if (candidate) found.add(candidate);
            }
          }
          if (el.shadowRoot) scan(el.shadowRoot);
        }
      };
      scan(doc);
      const candidates = [...found];
      if (!candidates.length) return;
      const index = current ? candidates.indexOf(current) : -1;
      current =
        candidates[
          index < 0
            ? direction > 0
              ? 0
              : candidates.length - 1
            : (index + direction + candidates.length) % candidates.length
        ];
      history = [];
      smallerTarget = findSmaller();
      pinnedPointer = pointer;
      render();
    };
    const invoke = (target: HTMLButtonElement) => {
      if (target.disabled || target.hidden) return;
      if (target === cancel) finish(null);
      else if (target === capture) confirm();
      else if (target === fullPage) {
        render();
        if (!fullPage.hidden) finish({ kind: 'full-page' });
      } else if (target === larger) grow();
      else if (target === smaller) shrink();
    };
    const onInteraction = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type !== 'click') return;
      const path = event.composedPath();
      const target = path.find(
        (node) => node instanceof HTMLButtonElement && actions.contains(node),
      );
      if (target instanceof HTMLButtonElement) {
        invoke(target);
        return;
      }
      if (!path.includes(bar)) {
        // Keep an explicitly enlarged selection when clicking within its bounds.
        const click = event as MouseEvent;
        const rect = current?.getBoundingClientRect();
        if (
          !rect ||
          click.clientX < rect.left ||
          click.clientX > rect.right ||
          click.clientY < rect.top ||
          click.clientY > rect.bottom
        ) {
          chooseAt(click.clientX, click.clientY);
        }
        confirm();
      }
    };
    const onMove = (event: PointerEvent) => {
      event.stopImmediatePropagation();
      if (event.composedPath().includes(bar)) return;
      pointer = { x: event.clientX, y: event.clientY };
      // Small hand movement after arrow/button navigation must not undo that choice.
      if (
        pinnedPointer &&
        Math.hypot(pointer.x - pinnedPointer.x, pointer.y - pinnedPointer.y) <= 8
      )
        return;
      pinnedPointer = null;
      chooseAt(pointer.x, pointer.y);
    };
    const onKey = (event: KeyboardEvent) => {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        event.preventDefault();
        const available = [larger, smaller, capture, fullPage, cancel].filter(
          (el) => !el.disabled && !el.hidden,
        );
        const index = available.indexOf(shadow.activeElement as HTMLButtonElement);
        const next =
          index < 0
            ? event.shiftKey
              ? available.length - 1
              : 0
            : (index + (event.shiftKey ? -1 : 1) + available.length) % available.length;
        available[next].focus({ preventScroll: true });
      } else if (
        ['Escape', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          event.key,
        )
      ) {
        event.preventDefault();
        if (event.key === 'Escape') finish(null);
        else if (event.key === 'ArrowUp') grow();
        else if (event.key === 'ArrowDown') shrink();
        else if (event.key === 'ArrowLeft') navigate(-1);
        else if (event.key === 'ArrowRight') navigate(1);
        else if (shadow.activeElement instanceof HTMLButtonElement) invoke(shadow.activeElement);
        else if (event.key === 'Enter') confirm();
      }
    };
    const onCancel = () => finish(null);
    const onPageHide = () => finish(null);
    host.addEventListener('openscreenshot-cancel', onCancel);
    doc.documentElement.append(host);
    // Popover top layer keeps the picker above page dialogs and transformed roots.
    if (typeof host.showPopover === 'function') {
      host.setAttribute('popover', 'manual');
      host.showPopover();
    }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointermove', onMove, true);
    for (const name of [
      'pointerdown',
      'pointerup',
      'mousedown',
      'mouseup',
      'click',
      'dblclick',
      'auxclick',
      'contextmenu',
      'touchstart',
      'touchend',
    ]) {
      window.addEventListener(name, onInteraction, { capture: true, passive: false });
    }
    window.addEventListener('pagehide', onPageHide);
    bar.focus({ preventScroll: true });
    const tick = () => {
      if (done) return;
      if (!host.isConnected) {
        finish(null);
        return;
      }
      render();
      frame = requestAnimationFrame(tick);
    };
    tick();
  });
}
