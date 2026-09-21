import { IS_FIREFOX } from './browser';
/**
 * The rating funnel's local state (see agent_docs and the P0 brief, section
 * 11). Everything here is a plain local flag — no network call, nothing
 * blocks an export, and prompts are spaced by successful uses.
 */

/** The listing's reviews tab — where every Rate surface points. */
export const CWS_REVIEWS_URL =
  'https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp/reviews';

/** Set by a Rate action (or a legacy permanent dismissal); stops future prompts. */
const RATED_KEY = 'openscreenshot:rated-or-dismissed';
/** Successful exports/copies on this install, across editor and quick mode. */
const SUCCESS_COUNT_KEY = 'openscreenshot:export-success-count';
/** Success count at which the next reminder becomes eligible. */
const NEXT_PROMPT_KEY = 'openscreenshot:rate-next-success';
export const RATE_REMIND_AFTER = 20;
const PROMPTED_KEY = 'openscreenshot:rate-prompted';

/** How many successful exports/copies before the first prompt may appear. */
export const RATE_PROMPT_AFTER = 3;

/** Count one successful export or clipboard copy. */
export async function recordExportSuccess(): Promise<void> {
  const stored = await chrome.storage.local.get(SUCCESS_COUNT_KEY);
  const count = (stored[SUCCESS_COUNT_KEY] as number | undefined) ?? 0;
  await chrome.storage.local.set({ [SUCCESS_COUNT_KEY]: count + 1 });
}

/**
 * True after enough successes, unless rated, permanently dismissed, or snoozed.
 */
export async function shouldShowRatePrompt(): Promise<boolean> {
  if (IS_FIREFOX) return false;
  const stored = await chrome.storage.local.get([
    SUCCESS_COUNT_KEY,
    RATED_KEY,
    PROMPTED_KEY,
    NEXT_PROMPT_KEY,
  ]);
  if (stored[RATED_KEY]) return false;
  // Respect installs that were promised a one-time prompt before snoozing existed.
  if (stored[PROMPTED_KEY] && stored[NEXT_PROMPT_KEY] === undefined) return false;
  const next = (stored[NEXT_PROMPT_KEY] as number | undefined) ?? RATE_PROMPT_AFTER;
  return ((stored[SUCCESS_COUNT_KEY] as number | undefined) ?? 0) >= next;
}

/** Schedule the next opportunity even if the user closes the editor without answering. */
export async function markRatePromptShown(): Promise<void> {
  await remindRateLater();
}

/** The user clicked a Rate surface — stop future prompts. */
export async function markRatedOrDismissed(): Promise<void> {
  await chrome.storage.local.set({ [RATED_KEY]: true });
}

/** Count the snooze from the dismissal, not from when the prompt first appeared. */
export async function remindRateLater(): Promise<void> {
  const stored = await chrome.storage.local.get(SUCCESS_COUNT_KEY);
  const count = (stored[SUCCESS_COUNT_KEY] as number | undefined) ?? 0;
  await chrome.storage.local.set({
    [PROMPTED_KEY]: true,
    [NEXT_PROMPT_KEY]: count + RATE_REMIND_AFTER,
  });
}
