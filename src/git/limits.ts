/** Safety ceilings for untrusted local Git comparison input. */
export const MAXIMUM_TOTAL_PATCH_BYTES = 10 * 1024 * 1024;
export const MAXIMUM_CHANGED_FILES = 10_000;
export const MAXIMUM_ADDED_LINES = 250_000;
export const MAXIMUM_SOURCE_FILE_BYTES = 2 * 1024 * 1024;
export const MAXIMUM_PROCESS_STDERR_BYTES = 64 * 1024;
