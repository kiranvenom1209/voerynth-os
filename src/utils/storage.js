/**
 * Storage utility — thin async wrapper over localStorage.
 * Async signatures are kept so call-sites don't need changes.
 */

/**
 * Set a value in storage
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
export const setItem = async (key, value) => {
  localStorage.setItem(key, value);
};

/**
 * Get a value from storage
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export const getItem = async (key) => {
  return localStorage.getItem(key);
};

/**
 * Remove a value from storage
 * @param {string} key
 * @returns {Promise<void>}
 */
export const removeItem = async (key) => {
  localStorage.removeItem(key);
};

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export const clear = async () => {
  localStorage.clear();
};

/**
 * Get all keys from storage
 * @returns {Promise<string[]>}
 */
export const keys = async () => {
  return Object.keys(localStorage);
};

/**
 * Synchronous version of getItem
 * @param {string} key
 * @returns {string|null}
 */
export const getItemSync = (key) => {
  return localStorage.getItem(key);
};

export default {
  setItem,
  getItem,
  removeItem,
  clear,
  keys,
  getItemSync
};

