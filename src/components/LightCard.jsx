import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Power } from 'lucide-react';
import Card from './Card';
import { useHomeAssistant, useHassEntity } from '../context/HomeAssistantContext';
import useLongPress from '../hooks/useLongPress';
import useOptimisticValue from '../hooks/useOptimisticValue';
import { getEntityColor } from '../utils/utils';
import { getElementCenterOrigin } from '../utils/longPressMotion';
import BrandIcon from './BrandIcon';

const LightCard = ({ lightConfig, savedConfig, onColorPicker, index, delay, disableAnimation, editMode = false, onEditClick = null, cardId = null }) => {
    const { callService } = useHomeAssistant();
    const cardShellRef = useRef(null);
    const pendingBrightnessRef = useRef(null);
    const pendingTimerRef = useRef(null);
    const lastServiceAtRef = useRef(0);
    const lastLocalUpdateAtRef = useRef(0);

    // Use saved entity ID if available, otherwise use default
    const entityId = savedConfig?.entity || lightConfig.id;
    const displayName = savedConfig?.displayName || lightConfig.name;

    const entity = useHassEntity(entityId, { state: 'off', attributes: { brightness: 0 } });
    const isOn = entity.isActive;
    const LightIcon = lightConfig.icon || Lightbulb;
    const remoteBrightness = useMemo(() => {
        if (!isOn) return 0;
        const brightness = Number(entity.attributes?.brightness);
        return Number.isFinite(brightness) ? brightness : 255;
    }, [entity.attributes?.brightness, isOn]);

    const [localBrightness, setLocalBrightness] = useState(remoteBrightness);
    const [localIsOn, setLocalIsOn, rollbackLocalIsOn] = useOptimisticValue(isOn);

    useEffect(() => {
        if (Date.now() - lastLocalUpdateAtRef.current > 400) {
            setLocalBrightness(remoteBrightness);
        }
    }, [entityId, isOn, remoteBrightness]);

    useEffect(() => () => {
        if (pendingTimerRef.current) {
            clearTimeout(pendingTimerRef.current);
        }
    }, [entityId]);

    const canAdjustBrightness = entity.supportsBrightness && !entity.isMock;
    const visualIsOn = localIsOn;
    const displayBrightness = canAdjustBrightness ? localBrightness : remoteBrightness;

    // Determine visual color based on state attributes
    const activeColorStyle = entity.color?.hexColor?.startsWith('#') ? entity.color.hexColor : getEntityColor(entity.raw);
    const colorStyle = visualIsOn ? (activeColorStyle || '#f59e0b') : '#475569'; // Slate-600 if off

    const openColorPicker = useCallback(() => {
        const origin = getElementCenterOrigin(cardShellRef.current);
        if (origin) {
            onColorPicker?.(entityId, origin);
        } else {
            onColorPicker?.(entityId);
        }
    }, [entityId, onColorPicker]);

    const shouldIgnoreColorPickerTarget = useCallback((target) => {
        return editMode || target.closest('button, input, textarea, select, [data-light-card-control], [data-light-card-power-zone]');
    }, [editMode]);

    const shouldStartColorLongPress = useCallback((event) => {
        return !shouldIgnoreColorPickerTarget(event.target);
    }, [shouldIgnoreColorPickerTarget]);

    const longPress = useLongPress(openColorPicker, 600, { shouldStart: shouldStartColorLongPress });

    const clampBrightness = useCallback((value) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return 1;
        return Math.max(1, Math.min(255, Math.round(numericValue)));
    }, []);

    const sendBrightness = useCallback((value, immediate = false) => {
        if (!canAdjustBrightness) return;

        const brightness = clampBrightness(value);
        pendingBrightnessRef.current = brightness;

        const flush = () => {
            if (!pendingBrightnessRef.current) return;
            const nextBrightness = pendingBrightnessRef.current;
            pendingBrightnessRef.current = null;
            pendingTimerRef.current = null;
            lastServiceAtRef.current = Date.now();
            callService('light', 'turn_on', { entity_id: entityId, brightness: nextBrightness }).catch((error) => {
                console.warn('Failed to update light brightness:', error);
            });
        };

        if (immediate) {
            if (pendingTimerRef.current) {
                clearTimeout(pendingTimerRef.current);
                pendingTimerRef.current = null;
            }
            flush();
            return;
        }

        const elapsed = Date.now() - lastServiceAtRef.current;
        if (elapsed >= 90) {
            flush();
            return;
        }

        if (!pendingTimerRef.current) {
            pendingTimerRef.current = setTimeout(flush, 90 - elapsed);
        }
    }, [callService, canAdjustBrightness, clampBrightness, entityId]);

    const updateBrightness = useCallback((value, { immediate = false } = {}) => {
        if (!canAdjustBrightness) return;

        const brightness = clampBrightness(value);
        lastLocalUpdateAtRef.current = Date.now();
        setLocalBrightness(brightness);
        setLocalIsOn(true);
        sendBrightness(brightness, immediate);
    }, [canAdjustBrightness, clampBrightness, sendBrightness, setLocalIsOn]);

    const handleRangeChange = useCallback((event) => {
        updateBrightness(event.target.value);
    }, [updateBrightness]);

    const handleRangeCommit = useCallback((event) => {
        updateBrightness(event.target.value, { immediate: true });
    }, [updateBrightness]);

    const handlePowerToggle = useCallback(() => {
        const nextIsOn = !visualIsOn;
        setLocalIsOn(nextIsOn);

        if (nextIsOn) {
            lastLocalUpdateAtRef.current = Date.now();
            setLocalBrightness(Math.max(1, localBrightness || remoteBrightness || 255));
        }

        callService('light', nextIsOn ? 'turn_on' : 'turn_off', { entity_id: entityId }).catch((error) => {
            console.warn('Failed to toggle light:', error);
            rollbackLocalIsOn();
        });
    }, [
        callService,
        entityId,
        localBrightness,
        remoteBrightness,
        rollbackLocalIsOn,
        setLocalIsOn,
        visualIsOn
    ]);

    const handleCardContextMenu = useCallback((event) => {
        if (shouldIgnoreColorPickerTarget(event.target)) return;
        event.preventDefault();
        openColorPicker();
    }, [openColorPicker, shouldIgnoreColorPickerTarget]);

    return (
        <Card
            delay={delay !== undefined ? delay : index * 50}
            disableAnimation={disableAnimation}
            className={`group relative overflow-hidden transition-all duration-500 ${lightConfig.mobileOrderClass || ''} ${visualIsOn ? 'shadow-[0_0_30px_-5px_rgba(251,191,36,0.15)] border-amber-500/30' : 'opacity-70 hover:opacity-85'}`}
            editMode={editMode}
            onEditClick={onEditClick}
            cardId={cardId}
            containerRef={cardShellRef}
            containerProps={{
                'data-light-card-shell': true,
                style: { touchAction: 'pan-y' },
                onContextMenu: handleCardContextMenu,
                ...longPress,
            }}
        >
            {/* Subtle Glow Animation */}
            {visualIsOn && (
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
                data-light-card-body
                className="relative z-10 flex h-full min-h-full select-none flex-col"
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200`}
                            style={{
                                backgroundColor: visualIsOn ? `${colorStyle}20` : '#1e293b',
                                color: visualIsOn ? colorStyle : '#64748b',
                                boxShadow: visualIsOn ? `0 0 20px ${colorStyle}40` : 'none'
                            }}
                        >
                            {lightConfig.brandIcon ? (
                                <BrandIcon
                                    name={lightConfig.brandIcon}
                                    size={18}
                                    className="transition-all duration-200"
                                    style={visualIsOn ? { color: colorStyle } : {}}
                                />
                            ) : (
                                <LightIcon size={18} />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-kumbh text-slate-200 transition-colors duration-300">{displayName || entity.displayName}</span>
                            {entity.isMock && <span className="text-[8px] text-red-400 animate-pulse">Offline</span>}
                            {canAdjustBrightness && visualIsOn && (
                                <span className="text-[9px] text-slate-500 font-mono">
                                    {Math.round((displayBrightness / 255) * 100)}%
                                </span>
                            )}
                        </div>
                    </div>
                    <div data-light-card-power-zone className="-m-3 p-3">
                        <button
                            type="button"
                            data-light-card-control
                            onClick={handlePowerToggle}
                            aria-label={`Toggle ${displayName || entity.displayName}`}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110`}
                            style={{
                                backgroundColor: visualIsOn ? colorStyle : 'transparent',
                                borderColor: visualIsOn ? colorStyle : '#334155',
                                color: visualIsOn ? '#000' : '#64748b',
                                boxShadow: visualIsOn ? `0 0 15px ${colorStyle}` : 'none'
                            }}
                        >
                            <Power size={14} />
                        </button>
                    </div>
                </div>

                <div className="relative mt-auto h-2 w-full bg-slate-800 rounded-lg overflow-hidden">
                    <input
                        data-light-card-control
                        type="range"
                        min="1"
                        max="255"
                        value={Math.max(1, displayBrightness)}
                        disabled={!canAdjustBrightness}
                        onInput={handleRangeChange}
                        onChange={handleRangeChange}
                        onPointerUp={handleRangeCommit}
                        onKeyUp={handleRangeCommit}
                        aria-label={`${displayName || entity.displayName} brightness`}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 disabled:cursor-not-allowed"
                    />
                    <div
                        className="h-full rounded-lg transition-[width,background-color,box-shadow] duration-75"
                        style={{
                            width: `${canAdjustBrightness ? (displayBrightness / 255) * 100 : 0}%`,
                            backgroundColor: colorStyle,
                            boxShadow: visualIsOn ? `0 0 8px ${colorStyle}` : 'none'
                        }}
                    ></div>
                </div>
            </div>
        </Card>
    );
};

export default LightCard;
