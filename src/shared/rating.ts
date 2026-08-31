/**
 * The rating funnel's local state (see agent_docs and the P0 brief, section
 * 11). Everything here is a plain local flag — no network call, nothing
 * blocks an export, and the one post-success prompt shows at most once per
 * install.
 */

/** The listing's reviews tab — where every Rate surface points. */
export const CWS_REVIEWS_URL =
  'https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp/reviews';

/** Set by the Rate star or either prompt button; ends the funnel for good. */
const RATED_KEY = 'openscreenshot:rated-or-dismissed';
/** Successful exports/copies on this install, across editor and quick mode. */
const SUCCESS_COUNT_KEY = 'openscreenshot:export-success-count';
/** The one post-success prompt has been shown (regardless of the answer). */
const PROMPTED_KEY = 'openscreenshot:rate-prompted';

/** How many successful exports/copies before the one prompt may appear. */
export const RATE_PROMPT_AFTER = 3;

/** Count one successful export or clipboard copy. */
export async function recordExportSuccess(): Promise<void> {
  const stored = await chrome.storage.local.get(SUCCESS_COUNT_KEY);
  const count = (stored[SUCCESS_COUNT_KEY] as number | undefined) ?? 0;
  await chrome.storage.local.set({ [SUCCESS_COUNT_KEY]: count + 1 });
}

/**
 * True when the one post-success prompt is due: enough successes, the user
 * has never used a Rate surface, and the prompt has not been shown before.
 */
export async function shouldShowRatePrompt(): Promise<boolean> {
  const stored = await chrome.storage.local.get([SUCCESS_COUNT_KEY, RATED_KEY, PROMPTED_KEY]);
  if (stored[RATED_KEY] || stored[PROMPTED_KEY]) return false;
  return ((stored[SUCCESS_COUNT_KEY] as number | undefined) ?? 0) >= RATE_PROMPT_AFTER;
}

/** The prompt is on screen — never show it again, whatever the answer. */
export async function markRatePromptShown(): Promise<void> {
  await chrome.storage.local.set({ [PROMPTED_KEY]: true });
}

/** The user clicked a Rate surface (or Not now) — the funnel never nags. */
export async function markRatedOrDismissed(): Promise<void> {
  await chrome.storage.local.set({ [RATED_KEY]: true });
}
