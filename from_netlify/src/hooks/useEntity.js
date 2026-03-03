/**
 * --- HELPER: Entity Hook ---
 */
export const useEntity = (hassStates, entityId, mockData = {}) => {
    const entity = hassStates[entityId];
    if (entity) {
        return {
            state: entity.state,
            attributes: entity.attributes || {},
            entity_picture: entity.attributes?.entity_picture,
            isUnavailable: entity.state === 'unavailable' || entity.state === 'unknown',
            lastUpdated: new Date(entity.last_updated)
        };
    }
    return {
        ...mockData,
        attributes: mockData.attributes || {},
        isUnavailable: true,
        isMock: true
    };
};

export default useEntity;
