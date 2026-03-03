import React, { useState } from 'react';
import Card from '../Card';
import { CloudRain, MapPin } from 'lucide-react';
import { useAccentColor } from '../../context/AccentColorContext';

const GlobalRadarCard = ({ delay = 300, editMode = false, onEditClick = null, cardId = null }) => {
  const { colors } = useAccentColor();
  const [isInteractive, setIsInteractive] = useState(false);

  return (
    <Card
      title={
        <div className="flex items-center gap-2.5">
          <div className={`p-1 rounded-sm bg-slate-900 border border-slate-800 ${colors.text}`}>
            <CloudRain size={14} />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Weather Uplink</span>
        </div>
      }
      subtitle="Telemetry Active // Global Link"
      delay={delay}
      className="lg:col-span-2 min-h-[488px] p-0 overflow-hidden"
      noPadding
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      <div className="relative w-full h-[400px] bg-slate-950 overflow-hidden">
        <iframe
          src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=5&overlay=wind&product=ecmwf&level=surface&lat=50.657&lon=10.694&message=true"
          className={`w-full h-full border-0 transition-all duration-700 ${isInteractive ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-[1.02] opacity-80'}`}
          title="Windy"
        />

        {/* INTERACTION SHIELD */}
        {!isInteractive && (
          <div className="absolute inset-0 z-[100] bg-transparent pointer-events-auto cursor-default"></div>
        )}

        {/* HUD Overlays - Framing only, never block interaction */}
        <div className={`absolute inset-0 transition-all duration-700 pointer-events-none z-40 ${isInteractive ? 'opacity-0' : 'opacity-100'}`}>
          {/* Tactical Blue Color Overlay using blend mode */}
          <div className="absolute inset-0 tactical-blue-overlay pointer-events-none"></div>

          {/* Technical Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          {/* Tactical mode vignette & scanlines */}
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(2,6,23,0.8)] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(59,130,246,0.01),rgba(16,185,129,0.005),rgba(59,130,246,0.01))] bg-[length:100%_4px,5px_100%] pointer-events-none"></div>
        </div>

        {/* Tactical Mode Toggle Button */}
        <div className="absolute bottom-6 right-6 z-[500] flex flex-col items-end gap-3">
          <button
            onClick={() => setIsInteractive(!isInteractive)}
            className={`group relative px-4 py-2 rounded-sm border transition-all duration-500 overflow-hidden backdrop-blur-md ${isInteractive
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:border-slate-500/50 shadow-xl'
              }`}
          >
            {/* Skewed background effect */}
            <div className={`absolute inset-0 opacity-10 transition-transform duration-700 -skew-x-12 translate-x-16 group-hover:translate-x-0 ${isInteractive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>

            <div className="relative flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] uppercase font-bold">
              <div className={`w-1.5 h-1.5 rounded-full ${isInteractive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-slate-600'}`}></div>
              {isInteractive ? 'Interaction Active' : 'Tactical Lock'}
            </div>
          </button>

          {isInteractive && (
            <div className="px-3 py-1 bg-slate-950/90 backdrop-blur-xl border border-slate-800/80 rounded-sm animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-2xl">
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.3em] font-medium opacity-80">Manual Override Engaged</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GlobalRadarCard;

