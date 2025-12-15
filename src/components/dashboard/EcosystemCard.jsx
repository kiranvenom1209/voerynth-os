import React from 'react';
import Card from '../Card';
import BrandIcon from '../BrandIcon';

const integrations = [
  { 
    name: 'hue-only', 
    label: 'Philips Hue', 
    color: 'text-blue-400', 
    bgGlow: 'from-blue-500/20 to-blue-600/10', 
    borderGlow: 'border-blue-500/40' 
  },
  { 
    name: 'xiaomi-logo', 
    label: 'Xiaomi', 
    color: 'text-orange-400', 
    bgGlow: 'from-orange-500/20 to-orange-600/10', 
    borderGlow: 'border-orange-500/40' 
  },
  { 
    name: 'aqara-cube', 
    label: 'Aqara', 
    color: 'text-emerald-400', 
    bgGlow: 'from-emerald-500/20 to-emerald-600/10', 
    borderGlow: 'border-emerald-500/40' 
  },
  { 
    name: 'google-home', 
    label: 'Google', 
    color: 'text-blue-500', 
    bgGlow: 'from-blue-500/20 to-indigo-600/10', 
    borderGlow: 'border-blue-500/40' 
  },
  { 
    name: 'esphome', 
    label: 'ESPHome', 
    color: 'text-purple-400', 
    bgGlow: 'from-purple-500/20 to-purple-600/10', 
    borderGlow: 'border-purple-500/40' 
  },
  { 
    name: 'tuya', 
    label: 'Tuya', 
    color: 'text-amber-400', 
    bgGlow: 'from-amber-500/20 to-amber-600/10', 
    borderGlow: 'border-amber-500/40' 
  },
];

const EcosystemCard = ({ delay = 450, editMode = false, onEditClick = null, cardId = null }) => {
  return (
    <Card
      title="Connected Ecosystem"
      subtitle="Smart Home Integrations"
      delay={delay}
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {integrations.map((integration, idx) => (
          <div
            key={integration.name}
            className="group relative flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all duration-500 hover:scale-105 hover:-translate-y-1 opacity-0 animate-[slideUpFade_0.6s_ease-out_forwards] overflow-hidden"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${integration.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />

            {/* Animated border glow */}
            <div className={`absolute inset-0 rounded-xl border ${integration.borderGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Icon container with enhanced styling */}
            <div className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${integration.bgGlow} border ${integration.borderGlow} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
              <BrandIcon 
                name={integration.name} 
                size={32} 
                className={`${integration.color} group-hover:brightness-125 transition-all duration-500`} 
              />
            </div>

            {/* Label with better styling */}
            <span className={`relative z-10 text-xs ${integration.color} text-center font-kumbh font-semibold tracking-wide group-hover:text-white transition-colors duration-300`}>
              {integration.label}
            </span>

            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EcosystemCard;

