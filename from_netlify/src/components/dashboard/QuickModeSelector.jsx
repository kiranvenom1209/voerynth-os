import React from 'react';
import { Video, Music, Coffee, Sparkles } from 'lucide-react';
import { useHomeAssistant, useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';

const QuickModeButton = ({ mode }) => {
  const { callService } = useHomeAssistant();
  const { colors } = useAccentColor();
  const entity = useHassEntity(mode.id, { state: 'off' });
  const isActive = entity.state === 'on';

  const colorMap = {
    blue: isActive 
      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
      : 'bg-slate-800/50 border-slate-700 text-slate-500',
    purple: isActive 
      ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
      : 'bg-slate-800/50 border-slate-700 text-slate-500',
    emerald: isActive 
      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
      : 'bg-slate-800/50 border-slate-700 text-slate-500',
    amber: isActive 
      ? `${colors.bgSoft} ${colors.borderSoft} ${colors.text400}` 
      : 'bg-slate-800/50 border-slate-700 text-slate-500'
  };

  return (
    <button
      onClick={() => callService('input_boolean', 'toggle', { entity_id: mode.id })}
      className={`flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-2 rounded-lg border text-xs tracking-wider transition-all hover:scale-105 active:scale-95 touch-manipulation ${colorMap[mode.color]}`}
    >
      <mode.icon size={16} className={isActive ? 'animate-pulse' : ''} />
      {mode.label}
    </button>
  );
};

const QuickModeSelector = () => {
  const quickModes = [
    { id: 'input_boolean.movie_mode', label: 'Movie', icon: Video, color: 'purple' },
    { id: 'input_boolean.jazz_mode', label: 'Jazz', icon: Music, color: 'blue' },
    { id: 'input_boolean.mode_relax', label: 'Relax', icon: Coffee, color: 'emerald' },
    { id: 'input_boolean.pooja', label: 'Aarti', icon: Sparkles, color: 'amber' }
  ];

  return (
    <div className="flex gap-3 md:gap-4 flex-wrap animate-[slideUpFade_0.6s_ease-out] ml-4 sm:ml-6">
      {quickModes.map((mode) => (
        <QuickModeButton key={mode.id} mode={mode} />
      ))}
    </div>
  );
};

export default QuickModeSelector;

