import type { LastCapture } from '../shared/types';
import { t } from './i18n';

/** How a capture's source reads in the topbar's brand-mode chip and the
 * capture history shelf's rows — one label per source, one place it comes from. */
export function labelForSource(mode: LastCapture['mode']): string {
  switch (mode) {
    // Exact match for the popup's own "Full Page" capture-mode label — reused
    // rather than duplicated.
    case 'full-page':
      return t('modeFullPage');
    case 'visible':
      return t('editorSourceVisible');
    case 'region':
      return t('editorSourceRegion');
    case 'import':
      return t('editorSourceImported');
  }
}
