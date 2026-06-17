import { Activity, Cpu, Music, Settings, Wifi } from 'lucide-react';

export const createUpdateEntity = (entityId, entity) => {
  let friendlyName = entity?.attributes?.friendly_name || entityId.replace('update.', '').replace(/_/g, ' ');

  friendlyName = friendlyName
    .replace(/Home Assistant Core/gi, 'Control Hub Core')
    .replace(/Home Assistant Supervisor/gi, 'Control Hub Supervisor')
    .replace(/Home Assistant Operating System/gi, 'Control Hub Operating System')
    .replace(/Home Assistant/gi, 'Control Hub');

  return {
    id: entityId,
    name: friendlyName,
    entity,
    entityIdLower: entityId.toLowerCase(),
    nameLower: friendlyName.toLowerCase(),
  };
};

export const categorizeUpdates = (hassStates = {}) => {
  const categories = {
    system: [],
    addons: [],
    esphome: [],
    other: [],
  };

  const updateEntities = Object.keys(hassStates)
    .filter((entityId) => entityId.startsWith('update.'))
    .map((entityId) => createUpdateEntity(entityId, hassStates[entityId]));

  updateEntities.forEach((update) => {
    const { id, name, entityIdLower, nameLower } = update;

    if (
      entityIdLower.includes('home_assistant_core') ||
      entityIdLower.includes('home_assistant_supervisor') ||
      entityIdLower.includes('home_assistant_operating_system') ||
      nameLower.includes('home assistant core') ||
      nameLower.includes('control hub core') ||
      nameLower.includes('supervisor') ||
      nameLower.includes('operating system')
    ) {
      categories.system.push({
        id,
        name,
        icon: Activity,
        priority: entityIdLower.includes('core') ? 1 : entityIdLower.includes('supervisor') ? 2 : 3,
      });
    } else if (
      entityIdLower.includes('firmware') ||
      nameLower.includes('firmware') ||
      (entityIdLower.includes('esphome') && !entityIdLower.includes('_update'))
    ) {
      categories.esphome.push({
        id,
        name,
        icon: Cpu,
        priority: 99,
      });
    } else {
      let icon = Settings;
      if (nameLower.includes('zigbee') || nameLower.includes('matter') || nameLower.includes('z-wave')) {
        icon = Wifi;
      } else if (nameLower.includes('music') || nameLower.includes('media')) {
        icon = Music;
      } else if (nameLower.includes('esphome')) {
        icon = Cpu;
      }

      categories.addons.push({
        id,
        name,
        icon,
        priority: 99,
      });
    }
  });

  Object.keys(categories).forEach((category) => {
    categories[category].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });
  });

  return categories;
};

