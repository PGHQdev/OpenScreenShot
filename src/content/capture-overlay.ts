/**
 * Serialized by executeScript: keep all runtime dependencies inside this
 * function. A closed shadow root isolates the status card from page styles.
 */
export async function updateCaptureOverlay(
  action: 'show' | 'hide' | 'remove',
  percent: number | null = null,
  title = '',
  detail = '',
): Promise<void> {
  const win = window as Window & {
    __ossCaptureOverlay?: {
      host: HTMLDivElement;
      title: HTMLDivElement;
      detail: HTMLDivElement;
      progress: HTMLDivElement;
      fill: HTMLDivElement;
      percent: HTMLSpanElement;
    };
  };
  let state = win.__ossCaptureOverlay;
  if (action === 'remove') {
    state?.host.remove();
    delete win.__ossCaptureOverlay;
    return;
  }
  if (action === 'hide') {
    // No fade-out: even a translucent animation frame would taint the image.
    state?.host.style.setProperty('display', 'none', 'important');
    // Two animation frames cross a paint boundary, including when the region
    // selector has just been removed. Timeout rejects (never captures) if the
    // tab stops painting, for example when the user switches tabs mid-capture.
    await new Promise<void>((resolve, reject) => {
      let firstFrame = 0;
      let secondFrame = 0;
      const timeout = window.setTimeout(() => {
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        reject(new Error('Capture page stopped painting'));
      }, 2000);
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    });
    return;
  }
  if (!state?.host.isConnected) {
    const host = document.createElement('div');
    host.dataset.ossCaptureOverlay = '1';
    host.style.cssText = `all:initial!important;position:fixed!important;inset:auto 20px 20px auto!important;
      width:min(340px,calc(100vw - 32px))!important;z-index:2147483647!important;
      pointer-events:none!important;visibility:visible!important;display:block!important;
      color-scheme:light!important;direction:${document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'}!important;`;
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      :host { color-scheme: light; }
      * { box-sizing: border-box; }
      .card { padding: 18px 20px; border: 1px solid #d7e3f6; border-radius: 20px;
        background: #f5f8ff; color: #182b49; box-shadow: 0 6px 24px #16376a24;
        font: 400 13px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .heading { display: flex; align-items: center; gap: 12px; }
      .spinner { flex: 0 0 22px; width: 22px; height: 22px; border: 2px solid #c9daf5;
        border-top-color: #1967d2; border-right-color: #1967d2; border-radius: 50%;
        animation: spin 1s linear infinite; }
      .title { font-size: 14px; font-weight: 600; }
      .detail { margin-top: 8px; color: #475a76; }
      .row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
      .track { height: 4px; flex: 1; overflow: hidden; background: #d8e5f8; border-radius: 4px; }
      .fill { height: 100%; background: #1967d2; border-radius: inherit; }
      .track.indeterminate .fill { width: 35%; animation: sweep 1.4s ease-in-out infinite; }
      .percent { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; color: #1967d2; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes sweep { from { transform: translateX(-100%); } to { transform: translateX(390%); } }
      @media (prefers-reduced-motion: reduce) { .spinner, .track.indeterminate .fill { animation: none; } }
    `;
    const card = document.createElement('div');
    card.className = 'card';
    const heading = document.createElement('div');
    heading.className = 'heading';
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const titleNode = document.createElement('div');
    titleNode.className = 'title';
    titleNode.setAttribute('role', 'status');
    titleNode.setAttribute('aria-live', 'polite');
    const detailNode = document.createElement('div');
    detailNode.className = 'detail';
    const row = document.createElement('div');
    row.className = 'row';
    const progress = document.createElement('div');
    progress.className = 'track';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    const fill = document.createElement('div');
    fill.className = 'fill';
    const percentNode = document.createElement('span');
    percentNode.className = 'percent';
    percentNode.setAttribute('aria-hidden', 'true');
    progress.append(fill);
    row.append(progress, percentNode);
    heading.append(spinner, titleNode);
    card.append(heading, detailNode, row);
    root.append(style, card);
    state = { host, title: titleNode, detail: detailNode, progress, fill, percent: percentNode };
    win.__ossCaptureOverlay = state;
    document.documentElement.append(host);
  }
  state.host.style.setProperty('display', 'block', 'important');
  // Avoid repeating the live announcement on every tile.
  if (state.title.textContent !== title) state.title.textContent = title;
  state.detail.textContent = detail;
  state.progress.setAttribute('aria-label', title);
  const value = percent === null ? null : Math.min(100, Math.max(0, Math.round(percent)));
  state.progress.classList.toggle('indeterminate', value === null);
  if (value === null) {
    state.progress.removeAttribute('aria-valuenow');
    state.fill.style.removeProperty('width');
    state.percent.textContent = '';
  } else {
    state.progress.setAttribute('aria-valuenow', String(value));
    state.fill.style.width = `${value}%`;
    state.percent.textContent = `${value}%`;
  }
}
