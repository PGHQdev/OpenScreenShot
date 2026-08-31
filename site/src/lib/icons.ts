/**
 * The in-house line icon set: one 24px grid, one stroke, drawn as bare path
 * data so a page can colour and size it however its own section needs.
 *
 * Lived in the homepage until the welcome page wanted the same four marks for
 * the same four claims. Two callers, one copy — a second hand-kept set would
 * drift the moment either page redrew a glyph.
 */
export const ICON_PATHS = {
  capture:
    'M8 4H6a2 2 0 0 0-2 2v2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M14.4 12a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z',
  pen: 'm4 20 1.2-4.2L16.7 4.3a2.05 2.05 0 0 1 2.9 2.9L8.2 18.8 4 20ZM13.5 6.5l3 3',
  export: 'M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15',
  record: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z',
  terminal: 'm5 7 5 5-5 5M12.5 17H19',
} as const;
