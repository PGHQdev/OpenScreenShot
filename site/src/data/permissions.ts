/**
 * Every permission the extension declares, and why. One list per locale,
 * rendered by the homepage privacy section and by the Privacy Policy page, so
 * the two can never describe the same permission differently.
 *
 * The text lives in `src/i18n/<locale>/permissions.json` (en is the source of
 * truth); this module is the typed accessor. It mirrors `manifest.json`. A
 * permission added there is added to the en JSON. `name` values are Chrome
 * permission identifiers and are never translated.
 */
import { t, DEFAULT_LOCALE, type Locale } from '../i18n';

export type Permission = {
  name: string;
  why: string;
  /** Set only on the optional permissions, which name when Chrome asks. */
  when?: string;
};

/** Declared at install. `host_permissions` is empty, so none of these is a host. */
export const getInstallPermissions = (locale: Locale = DEFAULT_LOCALE): Permission[] =>
  t(locale, 'permissions').install as Permission[];

/** Optional, and asked for only when you use the recorder. */
export const getRecordingPermissions = (locale: Locale = DEFAULT_LOCALE): Permission[] =>
  t(locale, 'permissions').recording as Permission[];

/** English lists, for pages not yet localized. */
export const installPermissions: Permission[] = getInstallPermissions();
export const recordingPermissions: Permission[] = getRecordingPermissions();
