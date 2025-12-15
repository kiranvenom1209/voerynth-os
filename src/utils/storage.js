/**
 * Storage utility that uses Capacitor Preferences for mobile apps
 * and falls back to localStorage for web/desktop platforms.
 * 
 * This ensures data persistence across app restarts on mobile devices
 * where localStorage can be cleared by the system.
 */

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNativePlatform = Capacitor.isNativePlatform();

/**
 * Set a value in storage
 * @param {string} key - The key to store the value under
 * @param {string} value - The value to store
 * @returns {Promise<void>}
 */
export const setItem = async (key, value) => {
  if (isNativePlatform) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
};

/**
 * Get a value from storage
 * @param {string} key - The key to retrieve
 * @returns {Promise<string|null>} The stored value or null if not found
 */
export const getItem = async (key) => {
  if (isNativePlatform) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
};

/**
 * Remove a value from storage
 * @param {string} key - The key to remove
 * @returns {Promise<void>}
 */
export const removeItem = async (key) => {
  if (isNativePlatform) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export const clear = async () => {
  if (isNativePlatform) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
};

/**
 * Get all keys from storage
 * @returns {Promise<string[]>}
 */
export const keys = async () => {
  if (isNativePlatform) {
    const { keys } = await Preferences.keys();
    return keys;
  } else {
    return Object.keys(localStorage);
  }
};

/**
 * Synchronous version of getItem for backward compatibility
 * Only works on web/desktop platforms
 * @param {string} key - The key to retrieve
 * @returns {string|null} The stored value or null if not found
 */
export const getItemSync = (key) => {
  if (isNativePlatform) {
    console.warn('getItemSync called on native platform - use async getItem instead');
    return null;
  }
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

