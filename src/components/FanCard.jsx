import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Fan, Thermometer, Power, MoveHorizontal, Lightbulb, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, SlidersHorizontal } from 'lucide-react';
import Card from './Card';
import FanHeadPreview from './FanHeadPreview';
import { useHomeAssistant, useHassEntity } from '../context/HomeAssistantContext';
import estateEntities from '../config/estateEntities';
import useOptimisticValue from '../hooks/useOptimisticValue';
import useLongPress from '../hooks/useLongPress';
import { getElementCenterOrigin } from '../utils/longPressMotion';

const SPEED_SERVICE_THROTTLE_MS = 90;
const FALLBACK_PRESET_MODES = ['Normal', 'Natural', 'Sleep', 'Auto', 'Turbo', 'Custom'];
const FALLBACK_RGB_LIGHT_COLOR = [251, 191, 36];

const clampSpeed = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const parseNumberValue = (value, fallback) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
};

const getNumberBounds = (entity, fallback) => ({
    min: parseNumberValue(entity.attributes?.min, fallback.min),
    max: parseNumberValue(entity.attributes?.max, fallback.max),
    step: parseNumberValue(entity.attributes?.step, fallback.step),
});

const clampToBounds = (value, bounds) => {
    const clamped = Math.max(bounds.min, Math.min(bounds.max, Number(value)));
    const step = bounds.step > 0 ? bounds.step : 1;
    return Math.round(clamped / step) * step;
};

const clampColorChannel = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(0, Math.min(255, Math.round(numericValue)));
};

const hsToRgb = (hue, saturation, brightness = 255) => {
    const normalizedHue = ((Number(hue) % 360) + 360) % 360;
    const normalizedSaturation = Math.max(0, Math.min(100, Number(saturation) || 0)) / 100;
    const normalizedBrightness = Math.max(0, Math.min(255, Number(brightness) || 255)) / 255;
    const chroma = normalizedBrightness * normalizedSaturation;
    const x = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
    const match = normalizedBrightness - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (normalizedHue < 60) {
        red = chroma;
        green = x;
    } else if (normalizedHue < 120) {
        red = x;
        green = chroma;
    } else if (normalizedHue < 180) {
        green = chroma;
        blue = x;
    } else if (normalizedHue < 240) {
        green = x;
        blue = chroma;
    } else if (normalizedHue < 300) {
        red = x;
        blue = chroma;
    } else {
        red = chroma;
        blue = x;
    }

    return [red, green, blue].map((channel) => clampColorChannel((channel + match) * 255));
};

const getLightRgbColor = (entity) => {
    const rgbColor = entity.attributes?.rgb_color;
    if (Array.isArray(rgbColor) && rgbColor.length >= 3) {
        return rgbColor.slice(0, 3).map(clampColorChannel);
    }

    const hsColor = entity.attributes?.hs_color;
    if (Array.isArray(hsColor) && hsColor.length >= 2) {
        return hsToRgb(hsColor[0], hsColor[1], entity.attributes?.brightness);
    }

    return FALLBACK_RGB_LIGHT_COLOR;
};

const rgbString = (rgbColor) => `rgb(${rgbColor.join(', ')})`;
const rgbaString = (rgbColor, alpha) => `rgba(${rgbColor.join(', ')}, ${alpha})`;

const getPresetModes = (modes) => {
    if (Array.isArray(modes) && modes.length > 0) {
        return modes.filter(Boolean);
    }

    return FALLBACK_PRESET_MODES;
};

const formatModeLabel = (mode) => String(mode || 'Normal')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const FanCard = ({ delay = 0, disableAnimation, editMode = false, onEditClick = null, cardId = null, onColorPicker = null }) => {
    const { callService } = useHomeAssistant();
    const fanConfig = estateEntities.fan;
    const fan = useHassEntity(fanConfig.fan, { state: 'off', attributes: { percentage: 0 } });
    const temp = useHassEntity(fanConfig.temperature, { state: '22' });
    const oscillate = useHassEntity(fanConfig.oscillation, { state: 'off' });
    const dreoLight = useHassEntity(fanConfig.light, { state: 'off' });
    const horizontalAngle = useHassEntity(fanConfig.angleHorizontal, { state: '0', attributes: { min: -60, max: 60, step: 5 } });
    const verticalAngle = useHassEntity(fanConfig.angleVertical, { state: '0', attributes: { min: -30, max: 90, step: 5 } });
    const oscillationDirection = useHassEntity(fanConfig.oscillationDirection, { state: 'fixed' });
    const pendingSpeedRef = useRef(null);
    const pendingSpeedTimerRef = useRef(null);
    const lastSpeedServiceAtRef = useRef(0);
    const fanCardRef = useRef(null);
    const rgbLongPressTriggeredRef = useRef(false);
    const oscillationLongPressTriggeredRef = useRef(false);
    const modeLongPressTriggeredRef = useRef(false);
    const [positionPanelOpen, setPositionPanelOpen] = useState(false);
    const [modeMenuOpen, setModeMenuOpen] = useState(false);

    const remoteIsOn = fan.state === 'on';
    const remoteSpeed = remoteIsOn ? clampSpeed(fan.attributes.percentage || 0) : 0;
    const remoteIsOscillating = oscillate.state === 'on';
    const remoteLightOn = dreoLight.state === 'on';
    const horizontalBounds = useMemo(() => getNumberBounds(horizontalAngle, { min: -60, max: 60, step: 5 }), [horizontalAngle]);
    const verticalBounds = useMemo(() => getNumberBounds(verticalAngle, { min: -30, max: 90, step: 5 }), [verticalAngle]);
    const remoteHorizontal = clampToBounds(parseNumberValue(horizontalAngle.state, 0), horizontalBounds);
    const remoteVertical = clampToBounds(parseNumberValue(verticalAngle.state, 0), verticalBounds);
    const presetModes = useMemo(() => getPresetModes(fan.attributes.preset_modes), [fan.attributes.preset_modes]);
    const remotePresetMode = fan.attributes.preset_mode || presetModes[0];

    const [isOn, setOptimisticFanOn, rollbackFanOn] = useOptimisticValue(remoteIsOn);
    const [localSpeed, setOptimisticSpeed, rollbackSpeed] = useOptimisticValue(remoteSpeed);
    const [isOscillating, setOptimisticOscillating, rollbackOscillating] = useOptimisticValue(remoteIsOscillating);
    const [isLightOn, setOptimisticLightOn, rollbackLightOn] = useOptimisticValue(remoteLightOn);
    const [localHorizontal, setOptimisticHorizontal, rollbackHorizontal] = useOptimisticValue(remoteHorizontal);
    const [localVertical, setOptimisticVertical, rollbackVertical] = useOptimisticValue(remoteVertical);
    const [localDirection, setOptimisticDirection, rollbackDirection] = useOptimisticValue(oscillationDirection.state || 'fixed');
    const [localPresetMode, setOptimisticPresetMode, rollbackPresetMode] = useOptimisticValue(remotePresetMode);

    const targetSpeed = isOn ? localSpeed : 0;
    const isTurboMode = String(localPresetMode).toLowerCase() === 'turbo';
    const visualSpeed = isTurboMode && isOn ? 100 : targetSpeed;
    const fanStatus = isOn ? (isTurboMode ? 'Turbo Mode' : `${targetSpeed}% Power`) : 'Offline';
    const rgbLightColor = getLightRgbColor(dreoLight);
    const rgbLightButtonStyle = {
        '--rgb-light-color': rgbString(rgbLightColor),
        borderColor: isLightOn ? rgbaString(rgbLightColor, 0.58) : undefined,
        background: isLightOn
            ? `linear-gradient(135deg, ${rgbaString(rgbLightColor, 0.22)}, rgba(15, 23, 42, 0.74))`
            : undefined,
        color: isLightOn ? rgbString(rgbLightColor) : undefined,
        boxShadow: isLightOn ? `0 0 18px ${rgbaString(rgbLightColor, 0.2)}` : undefined,
    };

    // Fixed Precision to 1 decimal
    const tempValue = parseFloat(temp.state);
    const displayTemp = !isNaN(tempValue) ? tempValue.toFixed(1) : temp.state;

    // Physics state for smooth spin-up/down with proportional speed
    const rotationRef = useRef(0);
    const currentSpeedRef = useRef(0); // Current actual speed (smoothly interpolated)
    const frameRef = useRef(null);
    const fanIconRef = useRef(null);

    useEffect(() => {
        const animate = () => {
            // Physics constants for smooth acceleration/deceleration
            const accelerationRate = 0.8; // How quickly to reach target speed
            const decelerationRate = 0.6; // How quickly to slow down
            const minSpeed = 0.05; // Minimum speed threshold to stop animation

            // Calculate target velocity based on percentage (0-100)
            // Scale: 0% = 0 deg/frame, 100% = 15 deg/frame (full speed)
            const targetVelocity = (visualSpeed / 100) * 15;

            // Smoothly interpolate current speed towards target
            const speedDifference = targetVelocity - currentSpeedRef.current;

            if (Math.abs(speedDifference) > 0.01) {
                // Accelerating or decelerating
                if (speedDifference > 0) {
                    // Speed up gradually
                    currentSpeedRef.current += speedDifference * accelerationRate * 0.1;
                } else {
                    // Slow down gradually
                    currentSpeedRef.current += speedDifference * decelerationRate * 0.1;
                }
            } else {
                // Close enough to target, snap to it
                currentSpeedRef.current = targetVelocity;
            }

            // Ensure we don't go below zero or above max
            currentSpeedRef.current = Math.max(0, Math.min(currentSpeedRef.current, 15));

            // Apply rotation based on current speed
            rotationRef.current = (rotationRef.current + currentSpeedRef.current) % 360;

            if (fanIconRef.current) {
                fanIconRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
            }

            // Continue animation if there's any movement or if we haven't reached target yet
            if (currentSpeedRef.current > minSpeed || visualSpeed > 0) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                // Fully stopped
                currentSpeedRef.current = 0;
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [visualSpeed]);

    useEffect(() => () => {
        if (pendingSpeedTimerRef.current) {
            clearTimeout(pendingSpeedTimerRef.current);
        }
    }, []);

    const flushSpeed = useCallback(() => {
        const nextSpeed = pendingSpeedRef.current;
        pendingSpeedRef.current = null;
        pendingSpeedTimerRef.current = null;

        if (nextSpeed === null) return;

        lastSpeedServiceAtRef.current = Date.now();
        callService('fan', 'set_percentage', {
            entity_id: fanConfig.fan,
            percentage: nextSpeed,
        }).catch((error) => {
            console.warn('Failed to update Dreo fan speed:', error);
            rollbackSpeed();
        });
    }, [callService, fanConfig.fan, rollbackSpeed]);

    const queueSpeedUpdate = useCallback((speed, immediate = false) => {
        pendingSpeedRef.current = clampSpeed(speed);

        if (immediate) {
            if (pendingSpeedTimerRef.current) {
                clearTimeout(pendingSpeedTimerRef.current);
                pendingSpeedTimerRef.current = null;
            }
            flushSpeed();
            return;
        }

        const elapsed = Date.now() - lastSpeedServiceAtRef.current;
        if (elapsed >= SPEED_SERVICE_THROTTLE_MS) {
            flushSpeed();
            return;
        }

        if (!pendingSpeedTimerRef.current) {
            pendingSpeedTimerRef.current = setTimeout(flushSpeed, SPEED_SERVICE_THROTTLE_MS - elapsed);
        }
    }, [flushSpeed]);

    const updateSpeed = useCallback((value, { immediate = false } = {}) => {
        const nextSpeed = clampSpeed(value);
        setOptimisticFanOn(true);
        setOptimisticSpeed(nextSpeed);
        queueSpeedUpdate(nextSpeed, immediate);
    }, [queueSpeedUpdate, setOptimisticFanOn, setOptimisticSpeed]);

    const handlePowerToggle = useCallback(() => {
        const nextOn = !isOn;
        const restoreSpeed = localSpeed > 0 ? localSpeed : (remoteSpeed > 0 ? remoteSpeed : 35);
        setOptimisticFanOn(nextOn);

        if (nextOn) {
            setOptimisticSpeed(restoreSpeed);
        }

        callService('fan', nextOn ? 'turn_on' : 'turn_off', {
            entity_id: fanConfig.fan,
            ...(nextOn ? { percentage: restoreSpeed } : {}),
        }).catch((error) => {
            console.warn('Failed to toggle Dreo fan:', error);
            rollbackFanOn();
            rollbackSpeed();
        });
    }, [
        callService,
        fanConfig.fan,
        isOn,
        localSpeed,
        remoteSpeed,
        rollbackFanOn,
        rollbackSpeed,
        setOptimisticFanOn,
        setOptimisticSpeed
    ]);

    const handleSpeedInput = useCallback((event) => {
        updateSpeed(event.target.value);
    }, [updateSpeed]);

    const handleSpeedCommit = useCallback((event) => {
        updateSpeed(event.target.value, { immediate: true });
    }, [updateSpeed]);

    const handleOscillationToggle = useCallback(() => {
        const nextOscillating = !isOscillating;
        setOptimisticOscillating(nextOscillating);
        callService('switch', nextOscillating ? 'turn_on' : 'turn_off', {
            entity_id: fanConfig.oscillation,
        }).catch((error) => {
            console.warn('Failed to toggle Dreo oscillation:', error);
            rollbackOscillating();
        });
    }, [
        callService,
        fanConfig.oscillation,
        isOscillating,
        rollbackOscillating,
        setOptimisticOscillating
    ]);

    const openPositionPanel = useCallback(() => {
        oscillationLongPressTriggeredRef.current = true;
        setPositionPanelOpen(true);
        setOptimisticDirection('fixed');
        callService('select', 'select_option', {
            entity_id: fanConfig.oscillationDirection,
            option: 'fixed',
        }).catch((error) => {
            console.warn('Failed to set Dreo fan direction mode:', error);
            rollbackDirection();
        });
    }, [
        callService,
        fanConfig.oscillationDirection,
        rollbackDirection,
        setOptimisticDirection
    ]);

    const handleLightToggle = useCallback(() => {
        const nextLightOn = !isLightOn;
        setOptimisticLightOn(nextLightOn);
        callService('light', nextLightOn ? 'turn_on' : 'turn_off', {
            entity_id: fanConfig.light,
        }).catch((error) => {
            console.warn('Failed to toggle Dreo RGB light:', error);
            rollbackLightOn();
        });
    }, [
        callService,
        fanConfig.light,
        isLightOn,
        rollbackLightOn,
        setOptimisticLightOn
    ]);

    const openLightColorPicker = useCallback(() => {
        rgbLongPressTriggeredRef.current = true;
        const origin = getElementCenterOrigin(fanCardRef.current);
        if (origin) {
            onColorPicker?.(fanConfig.light, origin);
        } else {
            onColorPicker?.(fanConfig.light);
        }
    }, [fanConfig.light, onColorPicker]);

    const setFanPresetMode = useCallback((mode, { closeMenu = false } = {}) => {
        if (!mode) return;

        setOptimisticPresetMode(mode);

        if (closeMenu) {
            setModeMenuOpen(false);
        }

        if (mode === localPresetMode) return;

        callService('fan', 'set_preset_mode', {
            entity_id: fanConfig.fan,
            preset_mode: mode,
        }).catch((error) => {
            console.warn('Failed to update Dreo preset mode:', error);
            rollbackPresetMode();
        });
    }, [
        callService,
        fanConfig.fan,
        localPresetMode,
        rollbackPresetMode,
        setOptimisticPresetMode
    ]);

    const openModeMenu = useCallback(() => {
        modeLongPressTriggeredRef.current = true;
        setModeMenuOpen(true);
    }, []);

    const rgbLightLongPress = useLongPress(openLightColorPicker, 600);
    const oscillationLongPress = useLongPress(openPositionPanel, 600);
    const modeLongPress = useLongPress(openModeMenu, 600);

    const handleRgbButtonClick = useCallback(() => {
        if (rgbLongPressTriggeredRef.current) {
            window.setTimeout(() => {
                rgbLongPressTriggeredRef.current = false;
            }, 0);
            return;
        }

        handleLightToggle();
    }, [handleLightToggle]);

    const handleRgbContextMenu = useCallback((event) => {
        event.preventDefault();
        openLightColorPicker();
    }, [openLightColorPicker]);

    const handleOscillationClick = useCallback(() => {
        if (oscillationLongPressTriggeredRef.current) {
            window.setTimeout(() => {
                oscillationLongPressTriggeredRef.current = false;
            }, 0);
            return;
        }

        handleOscillationToggle();
    }, [handleOscillationToggle]);

    const handleOscillationContextMenu = useCallback((event) => {
        event.preventDefault();
        openPositionPanel();
    }, [openPositionPanel]);

    const handleModeButtonClick = useCallback(() => {
        if (modeLongPressTriggeredRef.current) {
            window.setTimeout(() => {
                modeLongPressTriggeredRef.current = false;
            }, 0);
            return;
        }

        const currentIndex = presetModes.indexOf(localPresetMode);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % presetModes.length : 0;
        setFanPresetMode(presetModes[nextIndex]);
    }, [localPresetMode, presetModes, setFanPresetMode]);

    const handleModeContextMenu = useCallback((event) => {
        event.preventDefault();
        openModeMenu();
    }, [openModeMenu]);

    const commitFanPosition = useCallback((nextHorizontal, nextVertical) => {
        const nextH = clampToBounds(nextHorizontal, horizontalBounds);
        const nextV = clampToBounds(nextVertical, verticalBounds);
        const calls = [];

        setOptimisticHorizontal(nextH);
        setOptimisticVertical(nextV);

        if (nextH !== localHorizontal) {
            calls.push(callService('number', 'set_value', {
                entity_id: fanConfig.angleHorizontal,
                value: nextH,
            }));
        }

        if (nextV !== localVertical) {
            calls.push(callService('number', 'set_value', {
                entity_id: fanConfig.angleVertical,
                value: nextV,
            }));
        }

        if (calls.length === 0) return;

        Promise.all(calls).catch((error) => {
            console.warn('Failed to update Dreo fan position:', error);
            rollbackHorizontal();
            rollbackVertical();
        });
    }, [
        callService,
        fanConfig.angleHorizontal,
        fanConfig.angleVertical,
        horizontalBounds,
        localHorizontal,
        localVertical,
        rollbackHorizontal,
        rollbackVertical,
        setOptimisticHorizontal,
        setOptimisticVertical,
        verticalBounds
    ]);

    const nudgeFanPosition = useCallback((deltaHorizontal, deltaVertical) => {
        commitFanPosition(localHorizontal + deltaHorizontal, localVertical + deltaVertical);
    }, [commitFanPosition, localHorizontal, localVertical]);

    const handleHorizontalSlider = useCallback((event) => {
        commitFanPosition(event.target.value, localVertical);
    }, [commitFanPosition, localVertical]);

    const handleVerticalSlider = useCallback((event) => {
        commitFanPosition(localHorizontal, event.target.value);
    }, [commitFanPosition, localHorizontal]);

    const handleCenterPosition = useCallback(() => {
        commitFanPosition(0, 0);
    }, [commitFanPosition]);

    return (
        <Card
            className="md:col-span-2 bg-gradient-to-br from-slate-900/90 to-slate-900/50 relative overflow-visible border-slate-600/50"
            delay={delay}
            disableAnimation={disableAnimation}
            editMode={editMode}
            onEditClick={onEditClick}
            cardId={cardId}
            containerRef={fanCardRef}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-700
                 ${isOn ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                        <div ref={fanIconRef}>
                            <Fan size={32} />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-kumbh text-slate-100">{fanConfig.name}</h4>
                        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Thermometer size={12} className="text-orange-400" />
                                {displayTemp} C
                            </span>
                            <span className="w-px h-3 bg-slate-700"></span>
                            <span className={`tracking-wider ${isOn ? 'text-cyan-400' : 'text-slate-500'}`}>{fanStatus}</span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePowerToggle}
                    aria-label="Toggle Dreo fan"
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95
                ${isOn ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'bg-slate-800 text-slate-500 border-slate-600'}`}
                >
                    <Power size={20} />
                </button>
            </div>

            <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] tracking-widest text-slate-500 w-12">Speed</span>
                    {isTurboMode ? (
                        <div
                            aria-label="Turbo mode active"
                            className="flex min-h-9 flex-1 items-center justify-between rounded-full border border-amber-300/30 bg-[linear-gradient(90deg,rgba(251,191,36,0.16),rgba(14,165,233,0.08))] px-4 text-xs text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_20px_rgba(251,191,36,0.08)]"
                        >
                            <span className="font-medium tracking-[0.18em]">Turbo mode active</span>
                            <span className="font-mono text-amber-200/80">MAX</span>
                        </div>
                    ) : (
                        <div className="relative h-2 flex-1 bg-slate-800 rounded-full overflow-hidden group">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={targetSpeed}
                                disabled={!isOn}
                                onInput={handleSpeedInput}
                                onChange={handleSpeedInput}
                                onPointerUp={handleSpeedCommit}
                                onKeyUp={handleSpeedCommit}
                                aria-label="Dreo fan speed"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            />
                            <div className="h-full bg-cyan-500 rounded-full transition-all duration-75" style={{ width: `${targetSpeed}%` }}></div>
                        </div>
                    )}
                </div>

                <div className="flex max-w-[18rem] flex-wrap justify-start gap-2 sm:max-w-none sm:justify-end">
                    <button
                        type="button"
                        onClick={handleModeButtonClick}
                        onContextMenu={handleModeContextMenu}
                        aria-label="Cycle Dreo preset mode"
                        title="Long press for modes"
                        {...modeLongPress}
                        className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-xs tracking-wider text-slate-300 transition-all hover:border-cyan-400/50 hover:text-cyan-200"
                    >
                        <SlidersHorizontal size={14} />
                        Mode
                        <span className="font-mono text-cyan-300">{formatModeLabel(localPresetMode)}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleRgbButtonClick}
                        onContextMenu={handleRgbContextMenu}
                        aria-label="Toggle Dreo RGB light"
                        title="Long press for color"
                        {...rgbLightLongPress}
                        style={rgbLightButtonStyle}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs tracking-wider transition-all
                   ${isLightOn ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.16)]' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                    >
                        <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-full border border-white/20"
                            style={{
                                backgroundColor: rgbString(rgbLightColor),
                                opacity: isLightOn ? 1 : 0.45,
                                boxShadow: `0 0 12px ${rgbaString(rgbLightColor, isLightOn ? 0.58 : 0.24)}`,
                            }}
                        />
                        <Lightbulb size={14} className={isLightOn ? 'animate-pulse' : ''} />
                        RGB Light
                    </button>
                    <button
                        type="button"
                        onClick={handleOscillationClick}
                        onContextMenu={handleOscillationContextMenu}
                        aria-label="Toggle Dreo oscillation"
                        title="Long press for position"
                        {...oscillationLongPress}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs tracking-wider transition-all
                   ${isOscillating ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                    >
                        <MoveHorizontal size={14} className={isOscillating ? 'animate-pulse' : ''} />
                        Oscillation
                    </button>
                </div>

                {modeMenuOpen && (
                    <div
                        className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/55 p-3 sm:grid-cols-3 animate-long-press-pop"
                        aria-label="Dreo fan preset modes"
                    >
                        {presetModes.map((mode) => {
                            const isActiveMode = mode === localPresetMode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setFanPresetMode(mode, { closeMenu: true })}
                                    aria-label={`Set Dreo fan mode ${formatModeLabel(mode)}`}
                                    className={`flex items-center justify-center rounded-xl border px-3 py-2 text-xs transition-all active:scale-[0.98]
                                        ${isActiveMode ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]' : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}
                                >
                                    {formatModeLabel(mode)}
                                </button>
                            );
                        })}
                    </div>
                )}

                {positionPanelOpen && (
                    <div
                        className="rounded-2xl border border-cyan-400/20 bg-slate-950/50 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.35)] animate-long-press-pop"
                        aria-label="Dreo fan position control"
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">
                                    <Crosshair size={14} />
                                    Position
                                </div>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                    Mode {localDirection}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPositionPanelOpen(false)}
                                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                            >
                                Done
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_9rem] sm:items-center">
                            <div className="relative min-h-44 overflow-hidden rounded-2xl border border-slate-800">
                                <FanHeadPreview
                                    horizontalAngle={localHorizontal}
                                    verticalAngle={localVertical}
                                    speed={visualSpeed}
                                    isOn={isOn}
                                />
                                <div className="absolute bottom-3 left-3 rounded-full border border-slate-700/70 bg-slate-950/70 px-2.5 py-1 text-[10px] font-mono text-slate-300">
                                    H {localHorizontal} deg
                                </div>
                                <div className="absolute bottom-3 right-3 rounded-full border border-slate-700/70 bg-slate-950/70 px-2.5 py-1 text-[10px] font-mono text-slate-300">
                                    V {localVertical} deg
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <span />
                                <button
                                    type="button"
                                    onClick={() => nudgeFanPosition(0, verticalBounds.step)}
                                    aria-label="Nudge Dreo fan up"
                                    className="flex aspect-square items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 active:scale-95"
                                >
                                    <ArrowUp size={18} />
                                </button>
                                <span />
                                <button
                                    type="button"
                                    onClick={() => nudgeFanPosition(-horizontalBounds.step, 0)}
                                    aria-label="Nudge Dreo fan left"
                                    className="flex aspect-square items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 active:scale-95"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCenterPosition}
                                    aria-label="Center Dreo fan"
                                    className="flex aspect-square items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 transition-colors hover:bg-cyan-500/20 active:scale-95"
                                >
                                    <Crosshair size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => nudgeFanPosition(horizontalBounds.step, 0)}
                                    aria-label="Nudge Dreo fan right"
                                    className="flex aspect-square items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 active:scale-95"
                                >
                                    <ArrowRight size={18} />
                                </button>
                                <span />
                                <button
                                    type="button"
                                    onClick={() => nudgeFanPosition(0, -verticalBounds.step)}
                                    aria-label="Nudge Dreo fan down"
                                    className="flex aspect-square items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 active:scale-95"
                                >
                                    <ArrowDown size={18} />
                                </button>
                                <span />
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-500">
                                    Horizontal
                                    <span className="font-mono text-cyan-200">{localHorizontal} deg</span>
                                </span>
                                <input
                                    type="range"
                                    min={horizontalBounds.min}
                                    max={horizontalBounds.max}
                                    step={horizontalBounds.step}
                                    value={localHorizontal}
                                    onInput={handleHorizontalSlider}
                                    onChange={handleHorizontalSlider}
                                    aria-label="Dreo fan horizontal angle"
                                    className="w-full accent-cyan-400"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-500">
                                    Vertical
                                    <span className="font-mono text-cyan-200">{localVertical} deg</span>
                                </span>
                                <input
                                    type="range"
                                    min={verticalBounds.min}
                                    max={verticalBounds.max}
                                    step={verticalBounds.step}
                                    value={localVertical}
                                    onInput={handleVerticalSlider}
                                    onChange={handleVerticalSlider}
                                    aria-label="Dreo fan vertical angle"
                                    className="w-full accent-cyan-400"
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Wind Particles Effect */}
            {isOn && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute top-1/2 left-10 w-20 h-px bg-cyan-400 animate-[slideRight_1s_linear_infinite]"></div>
                    <div className="absolute top-1/3 left-20 w-12 h-px bg-cyan-400 animate-[slideRight_1.5s_linear_infinite] delay-100"></div>
                    <div className="absolute bottom-1/3 left-5 w-32 h-px bg-cyan-400 animate-[slideRight_0.8s_linear_infinite] delay-300"></div>
                </div>
            )}
        </Card>
    );
};

export default FanCard;
