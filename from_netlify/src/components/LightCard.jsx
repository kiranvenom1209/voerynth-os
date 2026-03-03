import React from 'react';
import { Lightbulb, Power } from 'lucide-react';
import Card from './Card';
import { useHomeAssistant, useHassEntity } from '../context/HomeAssistantContext';
import useLongPress from '../hooks/useLongPress';
import { getEntityColor } from '../utils/utils';
import BrandIcon from './BrandIcon';

const LightCard = ({ lightConfig, savedConfig, onColorPicker, index, delay, disableAnimation, editMode = false, onEditClick = null, cardId = null }) => {
    const { callService } = useHomeAssistant();

    // Use saved entity ID if available, otherwise use default
    const entityId = savedConfig?.entity || lightConfig.id;
    const displayName = savedConfig?.displayName || lightConfig.name;

    const entity = useHassEntity(entityId, { state: 'off', attributes: { brightness: 0 } });
    const isOn = entity.state === 'on';
    const LightIcon = lightConfig.icon || Lightbulb;

    // Determine visual color based on state attributes
    const colorStyle = isOn ? getEntityColor(entity.attributes) : '#475569'; // Slate-600 if off

    const longPress = useLongPress(() => {
        onColorPicker(entityId);
    }, 600);

    return (
        <Card
            delay={delay !== undefined ? delay : index * 50}
            disableAnimation={disableAnimation}
            className={`group relative overflow-hidden transition-all duration-500 ${lightConfig.mobileOrderClass || ''} ${isOn ? 'shadow-[0_0_30px_-5px_rgba(251,191,36,0.15)] border-amber-500/30' : 'opacity-70 hover:opacity-85'}`}
            editMode={editMode}
            onEditClick={onEditClick}
            cardId={cardId}
        >
            {/* Subtle Glow Animation */}
            {isOn && (
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div
                        className="absolute inset-0 animate-[pulse_5s_infinite]"
                        style={{
                            background: `radial-gradient(circle at top right, ${colorStyle}, transparent 70%)`,
                            opacity: 0.15
                        }}
                    ></div>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                </div>
            )}

            <div
                className="relative z-10 flex justify-between items-center mb-4 select-none"
                onContextMenu={(e) => { e.preventDefault(); onColorPicker(entityId); }} // Right click support
                {...longPress}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500`}
                        style={{
                            backgroundColor: isOn ? `${colorStyle}20` : '#1e293b',
                            color: isOn ? colorStyle : '#64748b',
                            boxShadow: isOn ? `0 0 20px ${colorStyle}40` : 'none'
                        }}
                    >
                        {lightConfig.brandIcon ? (
                            <BrandIcon
                                name={lightConfig.brandIcon}
                                size={18}
                                className="transition-all duration-500"
                                style={isOn ? { color: colorStyle } : {}}
                            />
                        ) : (
                            <LightIcon size={18} />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-kumbh text-slate-200 transition-colors duration-300">{displayName}</span>
                        {entity.isMock && <span className="text-[8px] text-red-400 animate-pulse">Offline</span>}
                    </div>
                </div>
                <button
                    onClick={() => callService('light', 'toggle', { entity_id: entityId })}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110`}
                    style={{
                        backgroundColor: isOn ? colorStyle : 'transparent',
                        borderColor: isOn ? colorStyle : '#334155',
                        color: isOn ? '#000' : '#64748b',
                        boxShadow: isOn ? `0 0 15px ${colorStyle}` : 'none'
                    }}
                >
                    <Power size={14} />
                </button>
            </div>

            <div className="relative h-1 w-full bg-slate-800 rounded-lg z-10 overflow-hidden">
                <input
                    type="range" min="0" max="255"
                    value={entity.attributes?.brightness || 0}
                    disabled={!isOn}
                    onChange={(e) => callService('light', 'turn_on', { entity_id: entityId, brightness: parseInt(e.target.value) })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                        width: `${(entity.attributes?.brightness / 255) * 100}%`,
                        backgroundColor: colorStyle,
                        boxShadow: isOn ? `0 0 8px ${colorStyle}` : 'none'
                    }}
                ></div>
            </div>
        </Card>
    );
};

export default LightCard;
