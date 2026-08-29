/**
 * Recording permission recovery. Not onboarding: the Record click asks for
 * tabCapture inline, and this page is where a refused prompt or a device
 * Chrome has hard-blocked is put right. One page, every permission row
 * visible with a live status; nothing here is a wizard step that can strand
 * the user. All grant state is queried fresh from the browser on every change
 * signal — never cached — so the page cannot disagree with reality.
 *
 * Camera and mic are probed on this page (extension origin) because it is the
 * same origin the webcam bubble iframe and the offscreen engine use: a grant
 * here is a grant for recording.
 */
import { useEffect, useState } from 'preact/hooks';
import { BrandMark } from '../shared/BrandMark';
import {
  IconCamera,
  IconCode,
  IconDisplay,
  IconEyeOff,
  IconGift,
  IconGlobe,
  IconMic,
  IconPinArrow,
  IconShield,
} from '../shared/icons';
import { getSettings } from '../shared/storage';
import { applyTheme, watchSystemTheme } from '../shared/theme';
import {
  classifyMediaError,
  setupComplete,
  siteSettingsUrl,
  type DevicePermission,
  type MediaBlock,
  type PermissionSnapshot,
} from '../shared/permissions';

function t(id: string): string {
  return chrome.i18n.getMessage(id) || id;
}

const EMPTY: PermissionSnapshot = {
  tabCapture: false,
  camera: 'prompt',
  mic: 'prompt',
  allUrls: false,
};

async function queryDevice(name: 'camera' | 'microphone'): Promise<DevicePermission> {
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName });
    return status.state;
  } catch {
    // A browser without the query keeps the row promptable; the probe button
    // still settles the real answer.
    return 'prompt';
  }
}

async function readSnapshot(): Promise<PermissionSnapshot> {
  const [tabCapture, allUrls, camera, mic] = await Promise.all([
    chrome.permissions.contains({ permissions: ['tabCapture'] }),
    chrome.permissions.contains({ origins: ['<all_urls>'] }),
    queryDevice('camera'),
    queryDevice('microphone'),
  ]);
  return { tabCapture, allUrls, camera, mic };
}

type RowError = MediaBlock | 'request-dismissed' | null;

export function App() {
  const [snap, setSnap] = useState<PermissionSnapshot>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<RowError>(null);
  const [micError, setMicError] = useState<RowError>(null);
  const [tabError, setTabError] = useState<RowError>(null);
  const fromRecord = new URLSearchParams(location.search).get('from') === 'record';

  async function refresh() {
    setSnap(await readSnapshot());
    setLoaded(true);
  }

  // Apply the stored theme on mount, then live-update a "system" setting
  // when the OS preference flips.
  useEffect(() => {
    void getSettings().then((s) => applyTheme(s.theme));
  }, []);
  useEffect(() => watchSystemTheme(() => void getSettings().then((s) => applyTheme(s.theme))), []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    chrome.permissions.onAdded.addListener(onChange);
    chrome.permissions.onRemoved.addListener(onChange);
    // PermissionStatus.onchange fires when the user flips camera/mic in
    // Chrome's site settings while this page is open.
    const statuses: PermissionStatus[] = [];
    for (const name of ['camera', 'microphone']) {
      navigator.permissions
        .query({ name: name as PermissionName })
        .then((s) => {
          s.onchange = onChange;
          statuses.push(s);
        })
        .catch(() => {});
    }
    return () => {
      chrome.permissions.onAdded.removeListener(onChange);
      chrome.permissions.onRemoved.removeListener(onChange);
      statuses.forEach((s) => (s.onchange = null));
    };
  }, []);

  async function enableTabCapture() {
    setTabError(null);
    const granted = await chrome.permissions.request({ permissions: ['tabCapture'] });
    if (!granted) setTabError('request-dismissed');
    await refresh();
  }

  async function probeDevice(kind: 'camera' | 'mic') {
    const setError = kind === 'camera' ? setCameraError : setMicError;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'camera' ? { video: true } : { audio: true },
      );
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      setError(classifyMediaError(err));
    }
    await refresh();
  }

  async function toggleAllUrls() {
    if (snap.allUrls) {
      await chrome.permissions.remove({ origins: ['<all_urls>'] });
    } else {
      await chrome.permissions.request({ origins: ['<all_urls>'] });
    }
    await refresh();
  }

  function openSiteSettings() {
    void chrome.tabs.create({ url: siteSettingsUrl(chrome.runtime.id) });
  }

  // window.close() only works for script-opened tabs; a tab the user reached
  // by URL needs the tabs API to close itself.
  function closeTab() {
    window.close();
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id != null) void chrome.tabs.remove(tab.id);
    });
  }

  const ready = setupComplete(snap);

  return (
    <div class="setup">
      <PinHint />
      <header class="setup-header">
        <BrandMark size={36} />
        <div>
          <h1>{t('setupTitle')}</h1>
          <p class="setup-intro">{t('setupIntro')}</p>
        </div>
      </header>

      <div class="trust-strip" data-testid="trust-strip">
        <a
          class="trust-pill"
          href="https://github.com/pghqdev/OpenScreenShot"
          target="_blank"
          rel="noreferrer"
        >
          <SetupIcon id="code" /> {t('setupTrustOpenSource')}
        </a>
        <span class="trust-pill">
          <SetupIcon id="shield" /> {t('setupTrustLocal')}
        </span>
        <span class="trust-pill">
          <SetupIcon id="eye-off" /> {t('setupTrustNoTracking')}
        </span>
        <a
          class="trust-pill"
          href="https://openscreenshot.app/cool-stuff"
          target="_blank"
          rel="noreferrer"
        >
          <SetupIcon id="gift" /> {t('setupCoolStuff')}
        </a>
        <span class="trust-hint">{t('setupTrustHint')}</span>
      </div>

      {fromRecord && !ready && <div class="banner banner-attention">{t('setupFromRecord')}</div>}
      {ready && (
        <div class="banner banner-ready" data-testid="ready-banner">
          <span>
            <strong>{t('setupReady')}</strong> {t('setupReadyHint')}
          </span>
          <button class="btn-primary" data-testid="finish-btn" onClick={closeTab}>
            {t('setupFinish')}
          </button>
        </div>
      )}

      {loaded && (
        <main class="setup-rows">
          <Row
            icon="display"
            title={t('setupTabCapture')}
            desc={t('setupTabCaptureDesc')}
            tag={snap.tabCapture ? 'granted' : 'required'}
            testid="row-tabcapture"
          >
            {!snap.tabCapture && (
              <button class="btn-primary" onClick={() => void enableTabCapture()}>
                {t('setupEnable')}
              </button>
            )}
            {tabError === 'request-dismissed' && <p class="row-hint">{t('setupDismissed')}</p>}
          </Row>

          <DeviceRow
            icon="camera"
            title={t('setupCamera')}
            desc={t('setupCameraDesc')}
            state={snap.camera}
            error={cameraError}
            onProbe={() => void probeDevice('camera')}
            onSiteSettings={openSiteSettings}
            testid="row-camera"
          />

          <DeviceRow
            icon="mic"
            title={t('setupMic')}
            desc={t('setupMicDesc')}
            state={snap.mic}
            error={micError}
            onProbe={() => void probeDevice('mic')}
            onSiteSettings={openSiteSettings}
            testid="row-mic"
          />

          <Row
            icon="globe"
            title={t('setupAcrossSites')}
            desc={t('setupAcrossSitesDesc')}
            tag={snap.allUrls ? 'granted' : 'optional'}
            testid="row-allurls"
          >
            <label class="switch-row">
              <input
                type="checkbox"
                class="switch"
                checked={snap.allUrls}
                onChange={() => void toggleAllUrls()}
              />
              <span>{t('setupAcrossSitesToggle')}</span>
            </label>
          </Row>
        </main>
      )}
    </div>
  );
}

function Tag({ kind }: { kind: 'granted' | 'required' | 'optional' | 'denied' }) {
  const label = {
    granted: t('setupGranted'),
    required: t('setupRequired'),
    optional: t('setupOptional'),
    denied: t('setupDeniedTag'),
  }[kind];
  return <span class={`tag tag-${kind}`}>{label}</span>;
}

type IconId = 'display' | 'camera' | 'mic' | 'globe' | 'code' | 'shield' | 'eye-off' | 'gift';

/**
 * Floating top-right nudge to pin the extension, with an arrow at Chrome's
 * puzzle menu. Live state from chrome.action.getUserSettings (polled — Chrome
 * has no pin-change event); once pinned it celebrates briefly, then leaves.
 */
function PinHint() {
  const [pinned, setPinned] = useState<boolean | null>(null);
  const [justPinned, setJustPinned] = useState(false);

  useEffect(() => {
    let last: boolean | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const check = () => {
      if (!chrome.action?.getUserSettings) return;
      chrome.action
        .getUserSettings()
        .then((s) => {
          if (last === false && s.isOnToolbar) {
            setJustPinned(true);
            hideTimer = setTimeout(() => setJustPinned(false), 4000);
          }
          last = s.isOnToolbar;
          setPinned(s.isOnToolbar);
        })
        .catch(() => setPinned(null));
    };
    check();
    const id = setInterval(check, 1500);
    return () => {
      clearInterval(id);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (pinned == null || (pinned && !justPinned)) return null;
  return (
    <div class={`pin-hint ${pinned ? 'pin-hint-done' : ''}`} data-testid="pin-hint">
      {pinned ? (
        <span class="pin-hint-text">{t('setupPinDone')}</span>
      ) : (
        <>
          <IconPinArrow class="pin-arrow" />
          <div class="pin-hint-text">
            <strong>{t('setupPinTitle')}</strong>
            <span>{t('setupPinSub')}</span>
          </div>
        </>
      )}
    </div>
  );
}

// Same icon set as the popup's ModeIcon.
function SetupIcon({ id }: { id: IconId }) {
  switch (id) {
    case 'display':
      return <IconDisplay />;
    case 'camera':
      return <IconCamera />;
    case 'mic':
      return <IconMic />;
    case 'globe':
      return <IconGlobe />;
    case 'code':
      return <IconCode />;
    case 'shield':
      return <IconShield />;
    case 'eye-off':
      return <IconEyeOff />;
    case 'gift':
      return <IconGift />;
  }
}

function Row(props: {
  icon: IconId;
  title: string;
  desc: string;
  tag: 'granted' | 'required' | 'optional' | 'denied';
  testid: string;
  children?: preact.ComponentChildren;
}) {
  return (
    <section class="row" data-testid={props.testid} data-state={props.tag}>
      <span class="row-icon">
        <SetupIcon id={props.icon} />
      </span>
      <div class="row-body">
        <div class="row-head">
          <h2>{props.title}</h2>
          <span class="row-desc">{props.desc}</span>
        </div>
        {props.children}
      </div>
      <Tag kind={props.tag} />
    </section>
  );
}

function DeviceRow(props: {
  title: string;
  desc: string;
  state: DevicePermission;
  error: RowError;
  onProbe: () => void;
  onSiteSettings: () => void;
  testid: string;
  icon: IconId;
}) {
  const tag =
    props.state === 'granted' ? 'granted' : props.state === 'denied' ? 'denied' : 'optional';
  // A hard denial cannot be re-prompted; the only way forward is site
  // settings (or the OS, which the copy explains).
  const blocked = props.state === 'denied' || props.error === 'blocked-site';
  return (
    <Row icon={props.icon} title={props.title} desc={props.desc} tag={tag} testid={props.testid}>
      {props.state !== 'granted' && !blocked && (
        <button class="btn-primary" onClick={props.onProbe}>
          {t('setupAllow')}
        </button>
      )}
      {blocked && props.error !== 'blocked-system' && (
        <div class="row-recover">
          <p class="row-hint">{t('setupBlockedSite')}</p>
          <button class="btn-ghost" onClick={props.onSiteSettings}>
            {t('setupOpenSiteSettings')}
          </button>
        </div>
      )}
      {props.error === 'blocked-system' && <p class="row-hint">{t('setupBlockedSystem')}</p>}
      {props.error === 'no-device' && <p class="row-hint">{t('setupNoDevice')}</p>}
      {props.error === 'dismissed' && <p class="row-hint">{t('setupDismissed')}</p>}
    </Row>
  );
}
