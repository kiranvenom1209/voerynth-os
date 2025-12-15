import React from 'react';
import { Train } from 'lucide-react';
import Card from '../Card';
import { useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';

const TransitCard = ({ delay = 200, editMode = false, onEditClick = null, cardId = null }) => {
  const { colors } = useAccentColor();
  const trainSensor = useHassEntity('sensor.schmalkalden_fachhochschule_departures_2', { 
    attributes: { next_departures: [] } 
  });
  const departures = trainSensor.attributes.next_departures || [];

  return (
    <Card
      title="Transit Uplink"
      subtitle="FH-S Station"
      delay={delay}
      className="lg:col-span-1"
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      <div className="space-y-0 divide-y divide-slate-800/50">
        {departures.slice(0, 5).map((train, i) => {
          // Logic to parse date
          let timeDisplay = '--:--';
          if (train.scheduledArrival) {
            const dateObj = new Date(train.scheduledArrival);
            if (!isNaN(dateObj.getTime())) {
              timeDisplay = dateObj.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              });
            } else {
              // Fallback if raw time string
              timeDisplay = train.scheduledArrival;
            }
          }

          return (
            <div 
              key={i} 
              className="flex justify-between items-center py-3 hover:bg-slate-800/20 transition-colors px-2 -mx-2 rounded"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded flex flex-col items-center justify-center text-slate-300 font-kumbh border border-slate-700">
                  <span className={`text-xs ${colors.text}`}>{timeDisplay}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-kumbh text-slate-200">{train.destination}</span>
                  <span className="text-[10px] font-kumbh text-slate-500 tracking-wider flex items-center gap-1">
                    <Train size={10} /> {train.train} • Plat {train.platform}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {train.delayArrival > 0 ? (
                  <span className="text-xs font-kumbh text-red-400">+{train.delayArrival}m</span>
                ) : (
                  <span className="text-xs font-kumbh text-emerald-500">On Time</span>
                )}
              </div>
            </div>
          );
        })}
        {departures.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm font-kumbh italic">
            Scanning for departures...
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransitCard;

