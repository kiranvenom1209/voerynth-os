import { create } from 'zustand';
import * as storage from '../utils/storage';

/**
 * People Configuration Store
 * Stores custom icons and other preferences for people entities
 */
const usePeopleStore = create((set, get) => ({
  // Custom icon assignments: { 'person.kiran': 'Heart', 'person.danny': 'Rocket' }
  customIcons: {},
  
  // Loading state
  loading: false,
  
  /**
   * Initialize the store by loading data from storage
   */
  initialize: async () => {
    try {
      set({ loading: true });
      const customIconsJson = await storage.getItem('people_custom_icons');
      const customIcons = customIconsJson ? JSON.parse(customIconsJson) : {};
      set({ customIcons, loading: false });
      console.log('✅ People store initialized:', customIcons);
    } catch (error) {
      console.error('❌ Failed to initialize people store:', error);
      set({ loading: false });
    }
  },
  
  /**
   * Set a custom icon for a person entity
   * @param {string} entityId - Person entity ID (e.g., 'person.kiran')
   * @param {string} iconName - Icon name (e.g., 'Heart', 'Star')
   */
  setCustomIcon: async (entityId, iconName) => {
    try {
      const { customIcons } = get();
      const newCustomIcons = { ...customIcons, [entityId]: iconName };
      await storage.setItem('people_custom_icons', JSON.stringify(newCustomIcons));
      set({ customIcons: newCustomIcons });
      console.log(`✅ Set custom icon for ${entityId}:`, iconName);
    } catch (error) {
      console.error('❌ Failed to set custom icon:', error);
    }
  },
  
  /**
   * Remove custom icon for a person entity
   * @param {string} entityId - Person entity ID
   */
  removeCustomIcon: async (entityId) => {
    try {
      const { customIcons } = get();
      const newCustomIcons = { ...customIcons };
      delete newCustomIcons[entityId];
      await storage.setItem('people_custom_icons', JSON.stringify(newCustomIcons));
      set({ customIcons: newCustomIcons });
      console.log(`✅ Removed custom icon for ${entityId}`);
    } catch (error) {
      console.error('❌ Failed to remove custom icon:', error);
    }
  },
  
  /**
   * Get custom icon for a person entity
   * @param {string} entityId - Person entity ID
   * @returns {string|null} Icon name or null if not set
   */
  getCustomIcon: (entityId) => {
    const { customIcons } = get();
    return customIcons[entityId] || null;
  },
  
  /**
   * Clear all custom icons
   */
  clearAll: async () => {
    try {
      await storage.removeItem('people_custom_icons');
      set({ customIcons: {} });
      console.log('✅ Cleared all custom icons');
    } catch (error) {
      console.error('❌ Failed to clear custom icons:', error);
    }
  },
}));

export default usePeopleStore;

