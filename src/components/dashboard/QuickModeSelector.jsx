import React, { useCallback } from 'react';
import { Video, Music, Coffee, Sparkles } from 'lucide-react';
import { useHomeAssistant, useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';
import estateEntities from '../../config/estateEntities';
import useOptimisticValue from '../../hooks/useOptimisticValue';

const modeIcons = {
  video: Video,
  music: Music,
  coffee: Coffee,
  sparkles: Sparkles,
};

const QuickModeButton = ({ mode }) => {
  const { callService } = useHomeAssistant();
  const { colors } = useAccentColor();
  const entity = useHassEntity(mode.id, { state: 'off' });
  const [isActive, setOptimisticActive, rollbackActive] = useOptimisticValue(entity.state === 'on');

  const handleToggle = useCallback(() => {
    const nextActive = !isActive;
    setOptimisticActive(nextActive);
    callService('input_boolean', nextActive ? 'turn_on' : 'turn_off', { entity_id: mode.id }).catch((error) => {
      console.warn('Failed to toggle quick mode:', error);
      rollbackActive();
    });
  }, [callService, isActive, mode.id, rollbackActive, setOptimisticActive]);

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
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-2 rounded-lg border text-xs tracking-wider transition-all hover:scale-105 active:scale-95 touch-manipulation ${colorMap[mode.color]}`}
    >
      {React.createElement(modeIcons[mode.icon] || Sparkles, { size: 16, className: isActive ? 'animate-pulse' : '' })}
      {mode.label}
    </button>
  );
};

const QuickModeSelector = () => {
  const quickModes = estateEntities.dashboard.quickModes;

  return (
    <div className="flex gap-3 md:gap-4 flex-wrap animate-[slideUpFade_0.6s_ease-out] ml-4 sm:ml-6">
      {quickModes.map((mode) => (
        <QuickModeButton key={mode.id} mode={mode} />
      ))}
    </div>
  );
};

export default QuickModeSelector;
