import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Palette, Sparkles, Sun, X } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import { useHomeAssistant, useHassEntity } from '../context/HomeAssistantContext';
import { getLongPressOriginStyle } from '../utils/longPressMotion';

const SERVICE_THROTTLE_MS = 90;

const DEFAULT_PICKER_STATE = {
  hue: 38,
  saturation: 78,
  brightness: 220,
};

const QUICK_TONES = [
  { label: 'Warm', hue: 34, saturation: 76, brightness: 236 },
  { label: 'Soft', hue: 45, saturation: 34, brightness: 210 },
  { label: 'Rose', hue: 340, saturation: 72, brightness: 218 },
  { label: 'Violet', hue: 268, saturation: 78, brightness: 226 },
  { label: 'Azure', hue: 207, saturation: 84, brightness: 230 },
  { label: 'Jade', hue: 153, saturation: 72, brightness: 218 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeHue = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_PICKER_STATE.hue;
  return Math.round(((numericValue % 360) + 360) % 360);
};

const normalizeSaturation = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_PICKER_STATE.saturation;
  return Math.round(clamp(numericValue, 0, 100));
};

const normalizeBrightness = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_PICKER_STATE.brightness;
  return Math.round(clamp(numericValue, 1, 255));
};

const normalizePickerState = (state) => ({
  hue: normalizeHue(state.hue),
  saturation: normalizeSaturation(state.saturation),
  brightness: normalizeBrightness(state.brightness),
});

const rgbToHsvState = (rgbColor) => {
  const [rawRed, rawGreen, rawBlue] = rgbColor;
  const red = clamp(Number(rawRed) || 0, 0, 255) / 255;
  const green = clamp(Number(rawGreen) || 0, 0, 255) / 255;
  const blue = clamp(Number(rawBlue) || 0, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
    hue *= 60;
  }

  return normalizePickerState({
    hue,
    saturation: max === 0 ? 0 : (delta / max) * 100,
    brightness: max * 255,
  });
};

const hsvToRgb = (hue, saturation, brightness) => {
  const normalizedHue = normalizeHue(hue);
  const normalizedSaturation = normalizeSaturation(saturation) / 100;
  const normalizedBrightness = normalizeBrightness(brightness) / 255;
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

  return [red, green, blue].map((channel) => Math.round((channel + match) * 255));
};

const rgbString = (rgbColor) => `rgb(${rgbColor.join(', ')})`;
const rgbaString = (rgbColor, alpha) => `rgba(${rgbColor.join(', ')}, ${alpha})`;

const normalizeEffectList = (effectList) => (
  Array.isArray(effectList)
    ? effectList.filter((effect) => typeof effect === 'string' && effect.trim().length > 0)
    : []
);

const getEntityPickerState = ({ hsColor, rgbColor, brightness, isActive }) => {
  const baseState = Array.isArray(hsColor) && hsColor.length >= 2
    ? normalizePickerState({
        hue: hsColor[0],
        saturation: hsColor[1],
        brightness: DEFAULT_PICKER_STATE.brightness,
      })
    : Array.isArray(rgbColor) && rgbColor.length >= 3
      ? rgbToHsvState(rgbColor)
      : DEFAULT_PICKER_STATE;

  return normalizePickerState({
    ...baseState,
    brightness: Number.isFinite(Number(brightness))
      ? Number(brightness)
      : isActive
        ? baseState.brightness
        : DEFAULT_PICKER_STATE.brightness,
  });
};

const buildServicePayload = (entityId, pickerState) => ({
  entity_id: entityId,
  hs_color: [normalizeHue(pickerState.hue), normalizeSaturation(pickerState.saturation)],
  brightness: normalizeBrightness(pickerState.brightness),
});

const ColorPickerModal = ({ isOpen, onClose, entityId, origin = null }) => {
  const { colors } = useAccentColor();
  const { callService } = useHomeAssistant();
  const entity = useHassEntity(entityId, {
    state: 'off',
    attributes: {
      hs_color: [DEFAULT_PICKER_STATE.hue, DEFAULT_PICKER_STATE.saturation],
      brightness: DEFAULT_PICKER_STATE.brightness,
    },
  });
  const wheelRef = useRef(null);
  const activePointerRef = useRef(null);
  const pickerStateRef = useRef(DEFAULT_PICKER_STATE);
  const pendingStateRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const lastServiceAtRef = useRef(0);
  const isInteractingRef = useRef(false);
  const [pickerState, setPickerState] = useState(DEFAULT_PICKER_STATE);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const entityHsColor = entity.attributes?.hs_color;
  const entityRgbColor = entity.attributes?.rgb_color;
  const entityBrightness = entity.attributes?.brightness;
  const entityEffect = entity.attributes?.effect;
  const entityEffectList = entity.attributes?.effect_list;
  const effectList = useMemo(() => normalizeEffectList(entityEffectList), [entityEffectList]);
  const entityHue = Array.isArray(entityHsColor) ? entityHsColor[0] : undefined;
  const entitySaturation = Array.isArray(entityHsColor) ? entityHsColor[1] : undefined;
  const entityRed = Array.isArray(entityRgbColor) ? entityRgbColor[0] : undefined;
  const entityGreen = Array.isArray(entityRgbColor) ? entityRgbColor[1] : undefined;
  const entityBlue = Array.isArray(entityRgbColor) ? entityRgbColor[2] : undefined;

  const entitySnapshot = useMemo(() => ({
    hsColor: entityHue === undefined || entitySaturation === undefined ? undefined : [entityHue, entitySaturation],
    rgbColor: entityRed === undefined || entityGreen === undefined || entityBlue === undefined
      ? undefined
      : [entityRed, entityGreen, entityBlue],
    brightness: entityBrightness,
    isActive: entity.isActive,
  }), [
    entityBlue,
    entityBrightness,
    entityGreen,
    entityHue,
    entityRed,
    entitySaturation,
    entity.isActive,
  ]);

  useEffect(() => {
    if (!isOpen || isInteractingRef.current) return;

    const nextState = getEntityPickerState(entitySnapshot);
    pickerStateRef.current = nextState;
    setPickerState(nextState);
  }, [entityId, entitySnapshot, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedEffect(entityEffect || effectList[0] || null);
  }, [effectList, entityEffect, isOpen]);

  useEffect(() => () => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
    }
  }, [entityId]);

  const flushPendingState = useCallback(() => {
    const nextState = pendingStateRef.current;
    pendingStateRef.current = null;
    pendingTimerRef.current = null;

    if (!nextState || !entityId) return;

    lastServiceAtRef.current = Date.now();
    callService('light', 'turn_on', buildServicePayload(entityId, nextState)).catch((error) => {
      console.warn('Failed to update light color:', error);
    });
  }, [callService, entityId]);

  const queueServiceUpdate = useCallback((nextState, immediate = false) => {
    if (!entityId) return;

    pendingStateRef.current = nextState;

    if (immediate) {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      flushPendingState();
      return;
    }

    const elapsed = Date.now() - lastServiceAtRef.current;
    if (elapsed >= SERVICE_THROTTLE_MS) {
      flushPendingState();
      return;
    }

    if (!pendingTimerRef.current) {
      pendingTimerRef.current = setTimeout(flushPendingState, SERVICE_THROTTLE_MS - elapsed);
    }
  }, [entityId, flushPendingState]);

  const updatePickerState = useCallback((partialState, { immediate = false } = {}) => {
    const nextState = normalizePickerState({
      ...pickerStateRef.current,
      ...partialState,
    });
    pickerStateRef.current = nextState;
    setPickerState(nextState);
    queueServiceUpdate(nextState, immediate);
  }, [queueServiceUpdate]);

  const updateFromWheelPointer = useCallback((event, options = {}) => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const rect = wheel.getBoundingClientRect();
    const diameter = Math.min(rect.width, rect.height);
    if (diameter <= 0) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const radius = diameter / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hue = Math.atan2(dy, dx) * (180 / Math.PI);
    const saturation = (Math.min(distance, radius) / radius) * 100;

    updatePickerState({ hue, saturation }, options);
  }, [updatePickerState]);

  const stopInteractionSoon = useCallback(() => {
    window.setTimeout(() => {
      isInteractingRef.current = false;
    }, 0);
  }, []);

  const handleWheelPointerDown = useCallback((event) => {
    event.preventDefault();
    isInteractingRef.current = true;
    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromWheelPointer(event);
  }, [updateFromWheelPointer]);

  const handleWheelPointerMove = useCallback((event) => {
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    updateFromWheelPointer(event);
  }, [updateFromWheelPointer]);

  const finishWheelPointer = useCallback((event) => {
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    updateFromWheelPointer(event, { immediate: true });
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    activePointerRef.current = null;
    stopInteractionSoon();
  }, [stopInteractionSoon, updateFromWheelPointer]);

  const handleWheelKeyDown = useCallback((event) => {
    const hueStep = event.shiftKey ? 15 : 3;
    const saturationStep = event.shiftKey ? 10 : 4;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      updatePickerState({ hue: pickerStateRef.current.hue + hueStep }, { immediate: true });
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      updatePickerState({ hue: pickerStateRef.current.hue - hueStep }, { immediate: true });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      updatePickerState({ saturation: pickerStateRef.current.saturation + saturationStep }, { immediate: true });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      updatePickerState({ saturation: pickerStateRef.current.saturation - saturationStep }, { immediate: true });
    }
  }, [updatePickerState]);

  const handleBrightnessInput = useCallback((event) => {
    isInteractingRef.current = true;
    updatePickerState({ brightness: event.target.value });
  }, [updatePickerState]);

  const handleBrightnessCommit = useCallback((event) => {
    isInteractingRef.current = true;
    updatePickerState({ brightness: event.target.value }, { immediate: true });
    stopInteractionSoon();
  }, [stopInteractionSoon, updatePickerState]);

  const handlePresetClick = useCallback((tone) => {
    isInteractingRef.current = true;
    updatePickerState(tone, { immediate: true });
    stopInteractionSoon();
  }, [stopInteractionSoon, updatePickerState]);

  const handleEffectClick = useCallback((effect) => {
    if (!entityId || !effect) return;
    setSelectedEffect(effect);
    callService('light', 'turn_on', {
      entity_id: entityId,
      effect,
    }).catch((error) => {
      console.warn('Failed to update light effect:', error);
    });
  }, [callService, entityId]);

  const fullBrightnessRgb = useMemo(() => (
    hsvToRgb(pickerState.hue, pickerState.saturation, 255)
  ), [pickerState.hue, pickerState.saturation]);

  const fullBrightnessColor = rgbString(fullBrightnessRgb);
  const brightnessPercent = Math.round((pickerState.brightness / 255) * 100);
  const lightOutput = pickerState.brightness / 255;
  const visibleOutput = Math.max(0.16, lightOutput);
  const softColorGlow = rgbaString(fullBrightnessRgb, 0.34);
  const strongColorGlow = rgbaString(fullBrightnessRgb, 0.58);
  const brightnessFillStyle = {
    width: `${brightnessPercent}%`,
    opacity: brightnessPercent > 0 ? Math.max(0.25, lightOutput) : 0,
    background: `linear-gradient(90deg, rgba(148, 163, 184, 0.18), ${fullBrightnessColor})`,
    boxShadow: `0 0 24px ${softColorGlow}`,
  };
  const markerRadius = (pickerState.saturation / 100) * 50;
  const markerAngle = pickerState.hue * (Math.PI / 180);
  const markerStyle = {
    left: `${50 + Math.cos(markerAngle) * markerRadius}%`,
    top: `${50 + Math.sin(markerAngle) * markerRadius}%`,
    backgroundColor: fullBrightnessColor,
    boxShadow: `0 0 22px ${strongColorGlow}`,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#02040f]/90 p-3 font-kumbh backdrop-blur-md animate-long-press-backdrop sm:items-center sm:p-4">
      <div
        className={`relative my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-[34rem] overflow-y-auto rounded-xl border ${colors.borderSoft} bg-[#050816]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] animate-long-press-pop sm:my-4 sm:max-h-[calc(100dvh-2rem)]`}
        style={getLongPressOriginStyle(origin)}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.08),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.2))]" />
        <div
          className="absolute inset-x-6 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${fullBrightnessColor}, transparent)` }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close color picker"
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-950/70 text-slate-400 transition-all duration-200 hover:border-slate-500 hover:text-white"
        >
          <X size={17} />
        </button>

        <div className="relative space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3 pr-12">
            <div
              className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700/70 bg-slate-950 shadow-lg"
              style={{ boxShadow: `0 0 24px ${softColorGlow}` }}
            >
              <span
                className="absolute inset-2 rounded-full blur-[1px]"
                style={{ backgroundColor: fullBrightnessColor, opacity: 0.76 }}
              />
              <Palette className="relative text-slate-950/80 mix-blend-luminosity" size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[0.95rem] font-semibold uppercase leading-none tracking-[0.18em] text-slate-100">Light Color</h3>
              <p className="mt-2 truncate text-[0.62rem] font-medium uppercase tracking-[0.34em] text-slate-500">{entity.displayName || entityId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[minmax(0,1fr)_7.25rem]">
            <div className="relative mx-auto aspect-square w-full max-w-[14rem] rounded-full border border-slate-800/80 bg-slate-950/75 p-2 shadow-[inset_0_0_22px_rgba(15,23,42,0.9),0_18px_60px_rgba(0,0,0,0.34)]">
              <div
                ref={wheelRef}
                role="slider"
                tabIndex={0}
                aria-label="Hue and saturation wheel"
                aria-valuetext={`${pickerState.hue} degrees, ${pickerState.saturation}% saturation`}
                className="relative aspect-square w-full cursor-crosshair touch-none overflow-hidden rounded-full border border-white/10 outline-none ring-offset-2 ring-offset-slate-950 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-slate-300"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.48) 14%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 62%), conic-gradient(from 90deg, #ff1a1a, #ffcc33, #6dff3f, #27eadb, #2f63ff, #bf36ff, #ff1a1a)',
                  filter: 'saturate(0.9) brightness(0.94)',
                }}
                onPointerDown={handleWheelPointerDown}
                onPointerMove={handleWheelPointerMove}
                onPointerUp={finishWheelPointer}
                onPointerCancel={finishWheelPointer}
                onKeyDown={handleWheelKeyDown}
              >
                <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_32px_rgba(2,6,23,0.36)]" />
                <div className="pointer-events-none absolute inset-[24%] rounded-full border border-slate-950/20" />
                <div
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg transition-[background-color,box-shadow] duration-75"
                  style={markerStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-slate-800/80 sm:grid-cols-1 sm:border-l sm:pl-5">
              <div className="flex min-w-0 flex-col items-center gap-2">
                <div
                  className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-slate-950 shadow-lg"
                  aria-label="Selected light color preview"
                >
                  <span
                    className="absolute inset-2 rounded-full transition-opacity duration-100"
                    style={{ backgroundColor: fullBrightnessColor, opacity: visibleOutput, boxShadow: `0 0 28px ${strongColorGlow}` }}
                  />
                  <span className="absolute inset-0 rounded-full shadow-[inset_0_0_18px_rgba(255,255,255,0.14),inset_0_0_28px_rgba(2,6,23,0.7)]" />
                </div>
              </div>
              <div className="flex min-w-0 flex-col justify-center text-center sm:text-left">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Hue</p>
                <p className="mt-1 text-base font-semibold leading-none tracking-[0.02em] text-slate-100">
                  {pickerState.hue}
                  <span className="ml-1 align-baseline text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-slate-500">deg</span>
                </p>
              </div>
              <div className="flex min-w-0 flex-col justify-center text-center sm:text-left">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Sat</p>
                <p className="mt-1 text-base font-semibold leading-none tracking-[0.02em] text-slate-100">{pickerState.saturation}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                <Sun size={14} />
                Brightness
              </span>
              <span className="text-xs font-semibold tracking-[0.08em] text-slate-300">{brightnessPercent}%</span>
            </div>
            <div
              className="color-brightness-rail"
              style={{
                '--brightness-base': `linear-gradient(90deg, #050816 0%, ${fullBrightnessColor} 100%)`,
                '--slider-thumb': fullBrightnessColor,
                '--slider-glow': strongColorGlow,
              }}
            >
              <span className="color-brightness-fill" style={brightnessFillStyle} />
              <input
                type="range"
                min="1"
                max="255"
                value={pickerState.brightness}
                onInput={handleBrightnessInput}
                onChange={handleBrightnessInput}
                onPointerUp={handleBrightnessCommit}
                onKeyUp={handleBrightnessCommit}
                onBlur={handleBrightnessCommit}
                aria-label="Light brightness"
                className="color-brightness-slider"
              />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {QUICK_TONES.map((tone) => {
              const toneColor = rgbString(hsvToRgb(tone.hue, tone.saturation, tone.brightness));
              const toneGlow = rgbaString(hsvToRgb(tone.hue, tone.saturation, 255), 0.5);
              const isActiveTone = Math.abs(tone.hue - pickerState.hue) <= 3
                && Math.abs(tone.saturation - pickerState.saturation) <= 4;

              return (
                <button
                  key={tone.label}
                  type="button"
                  onClick={() => handlePresetClick(tone)}
                  aria-label={`${tone.label} light color`}
                  className={`relative h-8 overflow-hidden rounded-lg border bg-slate-950/60 p-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 ${isActiveTone ? 'border-white/80' : 'border-slate-800'}`}
                  style={{ boxShadow: isActiveTone ? `0 0 18px ${toneGlow}` : 'none' }}
                >
                  <span
                    className="block h-full w-full rounded-md"
                    style={{ background: `linear-gradient(135deg, ${toneColor}, ${toneGlow})` }}
                  />
                  {isActiveTone && (
                    <Check className="absolute right-1.5 top-1.5 text-slate-950 drop-shadow" size={12} />
                  )}
                </button>
              );
            })}
          </div>

          {effectList.length > 0 && (
            <div className="space-y-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <Sparkles size={14} />
                  Effect
                </span>
                {selectedEffect && (
                  <span className="truncate text-xs font-semibold text-slate-300">{selectedEffect}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {effectList.map((effect) => {
                  const isActiveEffect = effect === selectedEffect;
                  return (
                    <button
                      key={effect}
                      type="button"
                      onClick={() => handleEffectClick(effect)}
                      aria-label={`Set light effect ${effect}`}
                      className={`flex min-h-10 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-all active:scale-[0.98]
                        ${isActiveEffect ? 'border-white/70 bg-white/10 text-slate-50 shadow-[0_0_18px_rgba(255,255,255,0.08)]' : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}
                    >
                      {effect}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-slate-300 transition-all duration-200 ${colors.bgHover} ${colors.borderHover}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerModal;
