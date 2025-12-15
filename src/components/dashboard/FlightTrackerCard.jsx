import React from 'react';
import Card from '../Card';

const FlightTrackerCard = ({ delay = 350, editMode = false, onEditClick = null, cardId = null }) => {
  return (
    <Card
      delay={delay}
      className="lg:col-span-2 min-h-[500px] p-0 relative"
      noPadding
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      {/* Floating Title Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 py-3 sm:py-4 pointer-events-none">
        <h3 className="font-serif text-slate-200 tracking-wider text-base sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Global Radar
        </h3>
        <p className="font-kumbh text-cyan-400/80 text-xs tracking-widest mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Air space above estate
        </p>
      </div>

      {/* Full-height iframe */}
      <iframe
        src="https://objectiveunclear.com/airloom.html?airport=NEARME"
        className="w-full h-full border-0 min-h-[500px] rounded-xl"
        title="Global Radar"
      />
    </Card>
  );
};

export default FlightTrackerCard;

