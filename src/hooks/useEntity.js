import { createHassEntityShape } from '../utils/hakitEntity';

export const useEntity = (hassStates, entityId, mockData = {}) => {
    return createHassEntityShape(entityId, hassStates[entityId], mockData);
};

export default useEntity;
