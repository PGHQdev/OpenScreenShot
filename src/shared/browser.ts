/** Build-time browser capabilities; Firefox ships screenshots only. */
export const IS_FIREFOX = import.meta.env.MODE === 'firefox';
export const RECORDING_SUPPORTED = !IS_FIREFOX;
