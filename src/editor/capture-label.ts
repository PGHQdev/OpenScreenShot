import type { LastCapture } from '../shared/types';

/** How a capture's source reads in the topbar's brand-mode chip and the
 * capture history shelf's rows — one label per source, one place it comes from. */
export function labelForSource(mode: LastCapture['mode']): string {
  switch (mode) {
    case 'full-page':
      return 'Full Page';
    case 'visible':
      return 'Visible';
    case 'region':
      return 'Region';
    case 'import':
      return 'Imported';
  }
}
