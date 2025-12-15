import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, Wind } from 'lucide-react';
import { useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';


const DashboardHeader = () => {
	const [time, setTime] = useState(() => new Date());

	useEffect(() => {
		const id = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(id);
	}, []);
  const { colors } = useAccentColor();
  
  const kiranLocation = useHassEntity('device_tracker.kiran_s_phone', { state: 'Home' });
  const personDetection = useHassEntity('binary_sensor.tc71_person_detection', { state: 'off' });
  const fanState = useHassEntity('fan.air_circulator', { state: 'On' });

  const hour = time.getHours();
  const day = time.toLocaleDateString('en-US', { weekday: 'long' });
  
  let greeting = `Good morning, Kiran.`;
  if (hour >= 12 && hour < 18) greeting = `Good afternoon, Kiran.`;
  if (hour >= 18) greeting = `Good evening, Kiran.`;

  let dayMsg = "Systems are green.";
  if (day === 'Monday') dayMsg = "New week, fresh logs. Set your priorities.";
  if (day === 'Friday') dayMsg = "It is Friday. Close loops and prepare for orbit.";
  if (day === 'Saturday') dayMsg = "Saturday detected. Ambition optional today.";
  if (day === 'Sunday') dayMsg = "Sunday is ideal for recovery and plotting.";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 md:pb-6 animate-[fadeIn_0.8s_ease-out]">
      <div className="w-full md:w-auto order-2 md:order-1 ml-4 sm:ml-6">
        <h1 className="text-3xl sm:text-3xl md:text-4xl font-serif text-slate-100 mb-2 tracking-tight">
          {greeting}
        </h1>
        <p className="text-slate-400 font-kumbh text-xs sm:text-sm">{dayMsg}</p>
        <div className="flex items-center flex-wrap gap-2 mt-3 md:mt-4 mb-4 md:mb-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-700">
            <User size={14} className="text-blue-400" />
            <span className="text-[10px] text-slate-300">Kiran: {kiranLocation.state}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-700">
            <ShieldCheck 
              size={14} 
              className={personDetection.state === 'on' ? 'text-red-500 animate-pulse' : 'text-emerald-500'} 
            />
            <span className="text-[10px] text-slate-300">Person Detect</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-700">
            <Wind size={14} className="text-green-500" />
            <span className="text-[10px] text-slate-300">{fanState.state}</span>
          </div>
        </div>
      </div>
      <div className="text-left md:text-right w-full md:w-auto order-1 md:order-2 mb-3 md:mb-0 ml-4 sm:ml-6 md:ml-0">
        <div className="text-3xl sm:text-4xl md:text-5xl font-kumbh text-slate-100 font-light tracking-tighter">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={`${colors.text}/60 text-xs font-kumbh tracking-[0.2em]`}>
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

