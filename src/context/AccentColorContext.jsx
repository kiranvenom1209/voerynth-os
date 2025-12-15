import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as storage from '../utils/storage';

const AccentColorContext = createContext(null);

// Color definitions for all accent colors
const COLOR_DEFINITIONS = {
  amber: {
    text: 'text-amber-500',
    text400: 'text-amber-400',
    text300: 'text-amber-300',
    textHover: 'hover:text-amber-400',
    bg: 'bg-amber-500/10',
    bgSolid: 'bg-amber-500',
    bgSolidHover: 'hover:bg-amber-600',
    bgSoft: 'bg-amber-500/20',
    bgHover: 'hover:bg-amber-500/10',
    border: 'border-amber-500',
    border400: 'border-amber-400',
    borderSoft: 'border-amber-500/30',
    borderHover: 'hover:border-amber-500/30',
    focusBorder: 'focus:border-amber-500',
    shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    shadowSoft: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    shadowGlow: 'shadow-[0_0_12px_rgba(251,191,36,0.6)]',
    glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    ring: 'ring-amber-500',
    gradientBg: 'bg-gradient-to-r from-amber-500/10 to-transparent',
    gradientPulse: 'bg-gradient-to-l from-amber-500/5 to-transparent',
    rgb: '251, 191, 36',
    hex: '#F59E0B'
  },
  emerald: {
    text: 'text-emerald-500',
    text400: 'text-emerald-400',
    text300: 'text-emerald-300',
    textHover: 'hover:text-emerald-400',
    bg: 'bg-emerald-500/10',
    bgSolid: 'bg-emerald-500',
    bgSolidHover: 'hover:bg-emerald-600',
    bgSoft: 'bg-emerald-500/20',
    bgHover: 'hover:bg-emerald-500/10',
    border: 'border-emerald-500',
    border400: 'border-emerald-400',
    borderSoft: 'border-emerald-500/30',
    borderHover: 'hover:border-emerald-500/30',
    focusBorder: 'focus:border-emerald-500',
    shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    shadowSoft: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    shadowGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    ring: 'ring-emerald-500',
    gradientBg: 'bg-gradient-to-r from-emerald-500/10 to-transparent',
    gradientPulse: 'bg-gradient-to-l from-emerald-500/5 to-transparent',
    rgb: '16, 185, 129',
    hex: '#10B981'
  },
  blue: {
    text: 'text-blue-500',
    text400: 'text-blue-400',
    text300: 'text-blue-300',
    textHover: 'hover:text-blue-400',
    bg: 'bg-blue-500/10',
    bgSolid: 'bg-blue-500',
    bgSolidHover: 'hover:bg-blue-600',
    bgSoft: 'bg-blue-500/20',
    bgHover: 'hover:bg-blue-500/10',
    border: 'border-blue-500',
    border400: 'border-blue-400',
    borderSoft: 'border-blue-500/30',
    borderHover: 'hover:border-blue-500/30',
    focusBorder: 'focus:border-blue-500',
    shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    shadowSoft: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    shadowGlow: 'shadow-[0_0_12px_rgba(59,130,246,0.6)]',
    glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    ring: 'ring-blue-500',
    gradientBg: 'bg-gradient-to-r from-blue-500/10 to-transparent',
    gradientPulse: 'bg-gradient-to-l from-blue-500/5 to-transparent',
    rgb: '59, 130, 246',
    hex: '#3B82F6'
  },
  purple: {
    text: 'text-purple-500',
    text400: 'text-purple-400',
    text300: 'text-purple-300',
    textHover: 'hover:text-purple-400',
    bg: 'bg-purple-500/10',
    bgSolid: 'bg-purple-500',
    bgSolidHover: 'hover:bg-purple-600',
    bgSoft: 'bg-purple-500/20',
    bgHover: 'hover:bg-purple-500/10',
    border: 'border-purple-500',
    border400: 'border-purple-400',
    borderSoft: 'border-purple-500/30',
    borderHover: 'hover:border-purple-500/30',
    focusBorder: 'focus:border-purple-500',
    shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    shadowSoft: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    shadowGlow: 'shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]',
    ring: 'ring-purple-500',
    gradientBg: 'bg-gradient-to-r from-purple-500/10 to-transparent',
    gradientPulse: 'bg-gradient-to-l from-purple-500/5 to-transparent',
    rgb: '168, 85, 247',
    hex: '#A855F7'
  },
  rose: {
    text: 'text-rose-500',
    text400: 'text-rose-400',
    text300: 'text-rose-300',
    textHover: 'hover:text-rose-400',
    bg: 'bg-rose-500/10',
    bgSolid: 'bg-rose-500',
    bgSolidHover: 'hover:bg-rose-600',
    bgSoft: 'bg-rose-500/20',
    bgHover: 'hover:bg-rose-500/10',
    border: 'border-rose-500',
    border400: 'border-rose-400',
    borderSoft: 'border-rose-500/30',
    borderHover: 'hover:border-rose-500/30',
    focusBorder: 'focus:border-rose-500',
    shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
    shadowSoft: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    shadowGlow: 'shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]',
    ring: 'ring-rose-500',
    gradientBg: 'bg-gradient-to-r from-rose-500/10 to-transparent',
    gradientPulse: 'bg-gradient-to-l from-rose-500/5 to-transparent',
    rgb: '244, 63, 94',
    hex: '#F43F5E'
  }
};

export const AccentColorProvider = ({ children }) => {
  const [accentColor, setAccentColor] = useState('amber');

  // Load accent color on mount
  useEffect(() => {
    const loadAccentColor = async () => {
      const savedColor = await storage.getItem('voerynth_accent_color');
      if (savedColor && COLOR_DEFINITIONS[savedColor]) {
        setAccentColor(savedColor);
      }
    };
    loadAccentColor();
  }, []);

  // Update accent color and persist to storage
  const updateAccentColor = useCallback(async (color) => {
    if (COLOR_DEFINITIONS[color]) {
      setAccentColor(color);
      await storage.setItem('voerynth_accent_color', color);
    }
  }, []);

  // Get current color classes
  const colors = useMemo(() => {
    return COLOR_DEFINITIONS[accentColor] || COLOR_DEFINITIONS.amber;
  }, [accentColor]);

  // Helper to get specific class type
  const getClass = useCallback((type) => {
    return colors[type] || '';
  }, [colors]);

  const value = useMemo(() => ({
    accentColor,
    setAccentColor: updateAccentColor,
    colors,
    getClass,
    // Expose color definitions for components that need all colors (like color picker)
    allColors: COLOR_DEFINITIONS
  }), [accentColor, updateAccentColor, colors, getClass]);

  return (
    <AccentColorContext.Provider value={value}>
      {children}
    </AccentColorContext.Provider>
  );
};

// Custom hook for using accent color
export const useAccentColor = () => {
  const context = useContext(AccentColorContext);
  if (!context) {
    throw new Error('useAccentColor must be used within an AccentColorProvider');
  }
  return context;
};

export default AccentColorContext;

