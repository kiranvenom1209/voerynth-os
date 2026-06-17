import * as storage from './storage';
import { getCssColorValue } from '@hakit/core';

/**
 * --- HELPER: Get Camera Stream URL (SNAPSHOT MODE) ---
 * Switching to camera_proxy (snapshot) prevents browser connection limit issues
 */
export const getSnapshotUrl = async (entityId, hassStates) => {
    const entity = hassStates[entityId];
    const baseUrl = await storage.getItem('voerynth_ha_url') || '';
    if (entity && entity.attributes.access_token) {
        return `${baseUrl}/api/camera_proxy/${entityId}?token=${entity.attributes.access_token}`;
    }
    return null;
};

/**
 * --- HELPER: Color Utilities ---
 */
export const getEntityColor = (attributes) => {
    const stateObject = attributes?.attributes
        ? attributes
        : {
            entity_id: 'light.preview',
            state: 'on',
            attributes: attributes || {}
        };

    try {
        const { hexColor } = getCssColorValue(stateObject);
        if (hexColor && hexColor.startsWith('#')) {
            return hexColor;
        }
    } catch {
        // Fall back to the previous behavior for partial or non-HA-shaped data.
    }

    if (stateObject.attributes.rgb_color) {
        return `rgb(${stateObject.attributes.rgb_color.join(',')})`;
    }
    return '#F59E0B'; // Default Amber
};

/**
 * --- HELPER: Format Entity State ---
 * Maps certain states to more user-friendly labels
 */
export const formatState = (state) => {
    if (!state) return 'Unknown';
    const lowState = state.toLowerCase();
    if (lowState === 'not_home') return 'Traveling';

    // Capitalize first letter for other states
    return state.charAt(0).toUpperCase() + state.slice(1);
};
