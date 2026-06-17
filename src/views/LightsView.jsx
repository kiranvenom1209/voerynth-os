import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Armchair, CircleDot, Gem, Sofa, Utensils, Lightbulb, Sparkles, Cone, ChefHat,
  Bath, LampWallDown, BedDouble, LampDesk, LandPlot, Lamp, TreePine, Layers,
  Sunrise, Building2, Flame, Music, Wind, Moon, X
} from 'lucide-react';
import Card from '../components/Card';
import FanCard from '../components/FanCard';
import LightCard from '../components/LightCard';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import { useAccentColor } from '../context/AccentColorContext';
import estateEntities from '../config/estateEntities';
import useLongPress from '../hooks/useLongPress';
import { getElementCenterOrigin, getLongPressOriginStyle } from '../utils/longPressMotion';

const iconMap = {
  armchair: Armchair,
  circleDot: CircleDot,
  gem: Gem,
  sofa: Sofa,
  utensils: Utensils,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  cone: Cone,
  chefHat: ChefHat,
  bath: Bath,
  lampWallDown: LampWallDown,
  bedDouble: BedDouble,
  lampDesk: LampDesk,
  landPlot: LandPlot,
  lamp: Lamp,
  treePine: TreePine,
  layers: Layers,
  sunrise: Sunrise,
  building2: Building2,
  flame: Flame,
  music: Music,
  wind: Wind,
  moon: Moon,
};

const ROOM_SCENE_ALIASES = {
  'Living Room': ['living_room', 'living'],
  'Dining Area': ['dining_area', 'dining'],
  Kitchen: ['kitchen'],
  Sanctuary: ['sanctuary', 'bathroom'],
  Bedroom: ['bedroom'],
  Backyard: ['backyard', 'garden', 'yard'],
};

const ROOM_ALIAS_STOPWORDS = new Set(['room', 'area', 'zone']);

const SCENE_INTENTS = [
  { tokens: ['tokyo', 'neon', 'cyber'], icon: 'building2', gradient: 'tokyo' },
  { tokens: ['jazz', 'drink', 'drinking', 'lounge'], icon: 'music', gradient: 'jazz' },
  { tokens: ['fireplace', 'fire', 'flame'], icon: 'flame', gradient: 'fireplace' },
  { tokens: ['red', 'ruby', 'scarlet', 'crimson'], icon: 'flame', gradient: 'red' },
  { tokens: ['energize', 'energy', 'bright', 'daylight'], icon: 'sunrise', gradient: 'energize' },
  { tokens: ['concentrate', 'focus', 'cool'], icon: 'wind', gradient: 'cool' },
  { tokens: ['sleep', 'bedtime', 'beginnings'], icon: 'moon', gradient: 'sleep' },
  { tokens: ['night', 'nighttime', 'dim'], icon: 'moon', gradient: 'night' },
  { tokens: ['under_the', 'under_t', 'star', 'stars', 'starlight'], icon: 'sparkles', gradient: 'stars' },
  { tokens: ['read', 'reading', 'warm'], icon: 'sunrise', gradient: 'warm' },
  { tokens: ['relax', 'calm', 'soft'], icon: 'sparkles', gradient: 'soft' },
];

const normalizeSceneText = (value) => (
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
);

const formatSceneLabel = (entityId) => (
  String(entityId || '')
    .replace(/^scene\./, '')
    .split('_')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const titleCaseSceneLabel = (label) => (
  String(label || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.length <= 3 && word === word.toUpperCase()
      ? word
      : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
    .join(' ')
);

const getRoomAliases = (roomName) => {
  const baseAlias = normalizeSceneText(roomName);
  const roomWords = baseAlias
    .split('_')
    .filter((word) => word.length > 2 && !ROOM_ALIAS_STOPWORDS.has(word));
  const overrideAliases = ROOM_SCENE_ALIASES[roomName] || [];

  return [...new Set([baseAlias, ...roomWords, ...overrideAliases].map(normalizeSceneText))]
    .filter((alias) => alias.length > 2);
};

const matchesRoomScene = (entityId, entity, aliases) => {
  const entityText = normalizeSceneText(`${entityId} ${entity?.attributes?.friendly_name || ''}`);
  return aliases.some((alias) => entityText.includes(alias));
};

const stripRoomContextFromSceneLabel = (label, roomName) => {
  const roomAliases = getRoomAliases(roomName)
    .map((alias) => alias.replace(/_/g, ' '))
    .sort((first, second) => second.length - first.length);

  let cleanedLabel = String(label || '').trim();

  roomAliases.forEach((alias) => {
    const aliasPattern = alias.split(/\s+/).map(escapeRegex).join('[\\s_-]+');
    cleanedLabel = cleanedLabel
      .replace(new RegExp(`^${aliasPattern}[\\s_-]*(scene)?[\\s_:-]*`, 'i'), '')
      .trim();
  });

  return cleanedLabel || label;
};

const getSceneDisplayLabel = (roomName, rawLabel) => {
  const strippedLabel = stripRoomContextFromSceneLabel(rawLabel, roomName);
  return titleCaseSceneLabel(strippedLabel.replace(/[_-]+/g, ' '));
};

const getSceneIntent = (entityId, label) => {
  const sceneText = normalizeSceneText(`${entityId} ${label}`);
  return SCENE_INTENTS.find((intent) => (
    intent.tokens.some((token) => sceneText.includes(token))
  )) || { icon: 'sparkles', gradient: 'warm' };
};

const resolveRoomScenes = (room, hassStates = {}) => {
  const configuredById = new Map((room.scenes || []).map((scene) => [scene.id, scene]));
  const aliases = getRoomAliases(room.name);
  const sceneMap = new Map();

  Object.entries(hassStates)
    .filter(([entityId]) => entityId.startsWith('scene.'))
    .filter(([entityId, entity]) => configuredById.has(entityId) || matchesRoomScene(entityId, entity, aliases))
    .forEach(([entityId, entity]) => {
      const configuredScene = configuredById.get(entityId);
      const rawLabel = entity?.attributes?.friendly_name || configuredScene?.label || formatSceneLabel(entityId);
      const label = getSceneDisplayLabel(room.name, rawLabel);
      const intent = getSceneIntent(entityId, rawLabel);
      sceneMap.set(entityId, {
        id: entityId,
        label,
        icon: configuredScene?.icon || intent.icon,
        gradient: configuredScene?.gradient || intent.gradient,
      });
    });

  (room.scenes || []).forEach((scene) => {
    if (!sceneMap.has(scene.id)) {
      const intent = getSceneIntent(scene.id, scene.label);
      sceneMap.set(scene.id, {
        ...scene,
        label: getSceneDisplayLabel(room.name, scene.label || formatSceneLabel(scene.id)),
        icon: scene.icon || intent.icon,
        gradient: scene.gradient || intent.gradient,
      });
    }
  });

  return Array.from(sceneMap.values());
};

const SceneButton = ({ scene, iconMap, gradientMap, callService, onScenePickerOpen }) => {
  const [isActivating, setIsActivating] = useState(false);
  const resetTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const SceneIcon = iconMap[scene.icon] || Sparkles;

  useEffect(() => () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
  }, []);

  const openScenePicker = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    longPressTriggeredRef.current = true;
    onScenePickerOpen?.();
  }, [onScenePickerOpen]);

  const buttonLongPress = useLongPress(openScenePicker, 600);

  const handleSceneActivate = useCallback((event) => {
    if (longPressTriggeredRef.current) {
      event?.preventDefault?.();
      longPressTriggeredRef.current = false;
      return;
    }

    setIsActivating(true);

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setIsActivating(false);
      resetTimerRef.current = null;
    }, 900);

    callService('scene', 'turn_on', { entity_id: scene.id }).catch((error) => {
      console.warn('Failed to activate scene:', error);
      setIsActivating(false);
    });
  }, [callService, scene.id]);

  const handleSceneContextMenu = useCallback((event) => {
    openScenePicker(event);
  }, [openScenePicker]);

  return (
    <button
      key={scene.id}
      type="button"
      data-scene-activate-button
      onClick={handleSceneActivate}
      onContextMenu={handleSceneContextMenu}
      aria-label={`Activate ${scene.label} scene`}
      {...buttonLongPress}
      className={`group relative overflow-hidden flex flex-col items-center justify-center gap-1 py-3 rounded-lg border bg-gradient-to-br ${gradientMap[scene.gradient] || gradientMap.warm} transition-all duration-300 hover:border-white/10 ${isActivating ? 'border-white/30 scale-[1.02] shadow-[0_0_24px_rgba(255,255,255,0.08)]' : 'border-white/5'}`}
    >
      {isActivating && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_0.9s_linear_infinite]" />
      )}
      <SceneIcon size={16} className={`relative z-10 transition-transform duration-300 ${isActivating ? 'scale-110' : ''}`} />
      <span className="relative z-10 text-[10px] tracking-wider">{scene.label}</span>
    </button>
  );
};

const ScenePickerModal = ({ isOpen, room, scenes, iconMap, gradientMap, callService, onClose, origin }) => {
  const { colors } = useAccentColor();
  const [activatingSceneId, setActivatingSceneId] = useState(null);
  const resetTimerRef = useRef(null);

  useEffect(() => () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
  }, []);

  const activateScene = useCallback((scene) => {
    setActivatingSceneId(scene.id);

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setActivatingSceneId(null);
      resetTimerRef.current = null;
    }, 900);

    callService('scene', 'turn_on', { entity_id: scene.id }).catch((error) => {
      console.warn('Failed to activate scene from picker:', error);
      setActivatingSceneId(null);
    });
  }, [callService]);

  if (!isOpen || !room) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-[#02040f]/88 p-3 font-kumbh backdrop-blur-md animate-long-press-backdrop sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${room.name} scenes`}
        className={`relative my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-[31rem] overflow-y-auto rounded-xl border ${colors.borderSoft} bg-[#050816]/95 shadow-[0_24px_80px_rgba(0,0,0,0.58)] animate-long-press-pop sm:my-4 sm:max-h-[calc(100dvh-2rem)]`}
        style={getLongPressOriginStyle(origin)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.08),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.74),rgba(2,6,23,0.28))]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scene picker"
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-950/70 text-slate-400 transition-all duration-200 hover:border-slate-500 hover:text-white"
        >
          <X size={17} />
        </button>

        <div className="relative space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3 pr-12">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${colors.borderSoft} bg-slate-950/80 ${colors.text}`}>
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[0.95rem] font-semibold uppercase leading-none tracking-[0.18em] text-slate-100">
                Scenes
              </h3>
              <p className="mt-2 truncate text-[0.62rem] font-medium uppercase tracking-[0.34em] text-slate-500">
                {room.name} / {scenes.length} available
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {scenes.map((scene) => {
              const SceneIcon = iconMap[scene.icon] || Sparkles;
              const isActivating = activatingSceneId === scene.id;

              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => activateScene(scene)}
                  aria-label={`Activate ${scene.label} scene from picker`}
                  className={`group relative flex min-h-16 items-center gap-3 overflow-hidden rounded-lg border bg-gradient-to-br px-3 text-left transition-all duration-200 active:scale-[0.98] ${gradientMap[scene.gradient] || gradientMap.warm} ${isActivating ? 'border-white/35 shadow-[0_0_24px_rgba(255,255,255,0.08)]' : 'border-white/5 hover:border-white/15'}`}
                >
                  {isActivating && (
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_0.9s_linear_infinite]" />
                  )}
                  <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950/50">
                    <SceneIcon size={16} />
                  </span>
                  <span className="relative z-10 min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-100">{scene.label}</span>
                    <span className="mt-1 block truncate text-[0.62rem] font-mono text-slate-500">{scene.id}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomSceneCard = ({
  room,
  scenes,
  iconMap,
  gradientMap,
  callService,
  delay,
  disableAnimation,
  editMode,
  onCardEdit,
  onScenePickerOpen,
}) => {
  const cardRef = useRef(null);

  const openScenePicker = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onScenePickerOpen(room, scenes, getElementCenterOrigin(cardRef.current));
  }, [onScenePickerOpen, room, scenes]);

  const shouldStartCardLongPress = useCallback((event) => (
    !editMode && !event.target.closest('[data-scene-activate-button]')
  ), [editMode]);

  const cardLongPress = useLongPress(openScenePicker, 600, { shouldStart: shouldStartCardLongPress });

  const handleCardContextMenu = useCallback((event) => {
    if (editMode || event.target.closest('[data-scene-activate-button]')) return;
    openScenePicker(event);
  }, [editMode, openScenePicker]);

  return (
    <Card
      className="flex flex-col justify-center"
      delay={delay}
      disableAnimation={disableAnimation}
      editMode={editMode}
      onEditClick={onCardEdit}
      cardId={`scenes-${room.name.toLowerCase().replace(/\s+/g, '-')}`}
      containerRef={cardRef}
      containerProps={{
        'aria-label': `${room.name} scenes card`,
        onContextMenu: handleCardContextMenu,
        ...cardLongPress,
      }}
    >
      <div className="grid h-full grid-cols-2 content-center gap-3">
        {room.scenes.map((scene) => (
          <SceneButton
            key={scene.id}
            scene={scene}
            iconMap={iconMap}
            gradientMap={gradientMap}
            callService={callService}
            onScenePickerOpen={openScenePicker}
          />
        ))}
      </div>
    </Card>
  );
};

const LightsView = ({ onColorPicker, editMode = false, onCardEdit = null, cardConfigs = {} }) => {
  const { callService, hassStates } = useHomeAssistant();
  const { accentColor, colors } = useAccentColor();
  const [scenePicker, setScenePicker] = useState({ isOpen: false, room: null, scenes: [], origin: null });

  const getWarmGradient = () => {
    const gradientMap = {
      amber: 'from-orange-500/20 to-yellow-500/20 text-amber-400',
      emerald: 'from-green-500/20 to-emerald-500/20 text-emerald-400',
      blue: 'from-sky-500/20 to-blue-500/20 text-blue-400',
      purple: 'from-purple-500/20 to-violet-500/20 text-purple-400',
      rose: 'from-rose-500/20 to-pink-500/20 text-rose-400',
    };
    return gradientMap[accentColor] || gradientMap.amber;
  };

  const gradientMap = {
    warm: getWarmGradient(),
    tokyo: 'from-pink-500/20 to-purple-500/20 text-pink-400',
    fireplace: 'from-red-900/40 to-orange-900/40 text-red-400',
    red: 'from-red-500/25 via-rose-700/20 to-slate-950/30 text-red-300',
    jazz: 'from-blue-900/40 to-indigo-900/40 text-blue-300',
    energize: 'from-amber-400/20 via-yellow-300/10 to-cyan-400/14 text-yellow-300',
    cool: 'from-blue-400/20 to-cyan-400/20 text-cyan-400',
    soft: 'from-rose-300/15 via-orange-200/10 to-slate-950/20 text-rose-200',
    sleep: 'from-indigo-900/50 to-slate-900/50 text-indigo-300',
    stars: 'from-indigo-950/80 via-slate-900/70 to-black text-indigo-200',
    night: 'from-slate-900 to-black text-slate-500',
  };

  const roomRenderData = estateEntities.lights.rooms.reduce((accumulator, room) => {
    const itemCount = room.lights.length + (room.hasEnv ? 1 : 0) + (room.scenes.length > 0 ? 1 : 0);
    return {
      delay: accumulator.delay + (itemCount * 50) + 100,
      rooms: [...accumulator.rooms, { ...room, startDelay: accumulator.delay }],
    };
  }, { delay: 0, rooms: [] }).rooms;

  const openScenePicker = useCallback((room, scenes, origin = null) => {
    setScenePicker({
      isOpen: true,
      room,
      scenes,
      origin,
    });
  }, []);

  const closeScenePicker = useCallback(() => {
    setScenePicker((current) => ({
      ...current,
      isOpen: false,
      origin: null,
    }));
  }, []);

  return (
    <div className="space-y-8">
      {roomRenderData.map((room) => {
        const RoomIcon = iconMap[room.icon] || Lightbulb;
        const roomSceneOptions = resolveRoomScenes(room, hassStates);
        return (
          <div key={room.name} className="space-y-4">
            <div
              className="flex items-center gap-3 border-b border-slate-800/50 pb-2 transition-colors duration-500 animate-[slideUpFade_0.5s_ease-out_both]"
              style={{ animationDelay: `${room.startDelay > 0 ? room.startDelay - 50 : 0}ms` }}
            >
              <RoomIcon className={`${colors.text}/80 transition-all duration-500`} size={20} />
              <h3 className="font-serif text-lg text-slate-300 transition-colors duration-500">{room.name}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.hasEnv && (
                <FanCard
                  delay={room.startDelay}
                  disableAnimation={false}
                  editMode={editMode}
                  onEditClick={onCardEdit}
                  cardId={`fan-${room.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onColorPicker={onColorPicker}
                />
              )}

              {room.lights.map((lightConfig, index) => {
                const cardId = `light-${lightConfig.id}`;
                const savedConfig = cardConfigs[cardId];
                const LightIcon = iconMap[lightConfig.icon] || Lightbulb;
                return (
                  <LightCard
                    key={lightConfig.id}
                    lightConfig={{ ...lightConfig, icon: LightIcon }}
                    savedConfig={savedConfig}
                    onColorPicker={onColorPicker}
                    index={index}
                    delay={room.startDelay + (index * 50) + (room.hasEnv ? 50 : 0)}
                    disableAnimation={false}
                    editMode={editMode}
                    onEditClick={onCardEdit}
                    cardId={cardId}
                  />
                );
              })}

              {room.scenes.length > 0 && (
                <RoomSceneCard
                  room={room}
                  scenes={roomSceneOptions}
                  iconMap={iconMap}
                  gradientMap={gradientMap}
                  callService={callService}
                  delay={room.startDelay + (room.lights.length * 50) + (room.hasEnv ? 50 : 0)}
                  disableAnimation={false}
                  editMode={editMode}
                  onCardEdit={onCardEdit}
                  onScenePickerOpen={openScenePicker}
                />
              )}
            </div>
          </div>
        );
      })}

      <ScenePickerModal
        isOpen={scenePicker.isOpen}
        room={scenePicker.room}
        scenes={scenePicker.scenes}
        iconMap={iconMap}
        gradientMap={gradientMap}
        callService={callService}
        onClose={closeScenePicker}
        origin={scenePicker.origin}
      />
    </div>
  );
};

export default LightsView;
