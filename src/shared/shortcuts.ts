/**
 * Popup shortcut-chip rules.
 *
 * Every capture mode answers to a digit key while the popup is open (1, 2, 3 in
 * list order). Chrome may also hold an OS-level binding, but only when the user
 * or a manifest suggestion registered one. The popup shows the digit on every
 * row so the column never mixes two meanings, and adds the OS binding as a
 * second chip when Chrome reports one.
 */

export interface ModeKeys {
  /** In-popup digit key. Always available while the mode list shows. */
  digit: string;
  /** OS-level binding from chrome.commands.getAll(), or null when unassigned. */
  osShortcut: string | null;
}

export function resolveModeKeys(
  command: string,
  index: number,
  shortcuts: Record<string, string>,
): ModeKeys {
  const raw = shortcuts[command];
  const trimmed = raw?.trim() ?? '';
  return { digit: String(index + 1), osShortcut: trimmed === '' ? null : trimmed };
}
