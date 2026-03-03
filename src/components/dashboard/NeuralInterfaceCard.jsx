import React from 'react';
import { Mic } from 'lucide-react';
import Card from '../Card';
import { useHomeAssistant, useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';

const NeuralInterfaceCard = ({ delay = 100, editMode = false, onEditClick = null, cardId = null }) => {
  const { hassStates } = useHomeAssistant();
  const { colors } = useAccentColor();
  
  const assistSwitch = useHassEntity('input_boolean.assist_switch', { state: 'off' });
  const ammuIntelligent = useHassEntity('input_boolean.ammu_intelligent', { state: 'off' });
  const satellite = useHassEntity('assist_satellite.home_assistant_voice_09af65_assist_satellite', { state: 'idle' });

  let brainState = 'Idle';
  let brainColor = 'text-emerald-500 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]';
  let brainTitle = 'Assistant Online';
  let brainDesc = 'System is active and ready for input.';

  if (assistSwitch.state === 'off') {
    brainState = 'Mycroft';
    brainColor = 'text-red-500 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]';
    brainTitle = 'Mycroft Active';
    brainDesc = 'Mycroft core online. Verbal input loop ready.';
  } else if (assistSwitch.state === 'on') {
    if (ammuIntelligent.state === 'off') {
      brainState = 'Ammu';
      brainColor = `${colors.text} ${colors.border} ${colors.shadow}`;
      brainTitle = 'Ammu Listening';
      brainDesc = 'Ammu core online. Waiting for command.';
    } else {
      brainState = 'Ammu Pro';
      brainColor = 'text-emerald-500 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]';
      brainTitle = 'Ammu Pro Active';
      brainDesc = 'Processing complex logic matrix.';
    }
  }

  if (satellite.state === 'listening') {
    brainTitle = `${brainState} – Listening`;
    brainDesc = "Speak clearly; receiving audio input.";
    brainColor += ' animate-pulse';
  } else if (satellite.state === 'processing') {
    brainTitle = `${brainState} – Thinking`;
    brainDesc = "Running diagnostics and formulating response.";
    brainColor += ' animate-pulse';
  } else if (satellite.state === 'responding') {
    brainTitle = `${brainState} – Responding`;
    brainDesc = "Delivering optimal solution.";
  }

  return (
    <Card
      title="Neural Interface"
      subtitle="Voice Command Center"
      className="lg:col-span-2 relative overflow-visible"
      delay={delay}
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 h-full relative z-10">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full opacity-20 animate-ping ${brainColor.split(' ')[0]}`}></div>
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-slate-900/50 backdrop-blur ${brainColor}`}>
            <Mic size={32} className={satellite.state === 'processing' ? 'animate-bounce' : ''} />
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-kumbh text-slate-100 tracking-wide">{brainTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400 font-kumbh max-w-md leading-relaxed">{brainDesc}</p>
          <div className="flex gap-2 mt-2 justify-center sm:justify-start flex-wrap">
            <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-kumbh text-slate-500">Latency: 12ms</span>
            <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-kumbh text-slate-500">Core: Online</span>
          </div>
        </div>
      </div>
      <div className={`absolute -right-10 -bottom-10 w-64 h-64 bg-gradient-to-tl from-current to-transparent opacity-10 blur-3xl rounded-full ${brainColor.split(' ')[0]}`}></div>
    </Card>
  );
};

export default NeuralInterfaceCard;

