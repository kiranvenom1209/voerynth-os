import React from 'react';
import Card from '../Card';

const GlobalRadarCard = ({ delay = 300, editMode = false, onEditClick = null, cardId = null }) => {
  return (
    <Card
      title="Live Weather"
      subtitle="Windy.com Uplink"
      delay={delay}
      className="lg:col-span-2 min-h-[300px] p-0"
      noPadding
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      <iframe
        src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=5&overlay=wind&product=ecmwf&level=surface&lat=50.657&lon=10.694&message=true"
        className="w-full h-full border-0 min-h-[300px] rounded-b-xl pointer-events-none"
        title="Windy"
      />
    </Card>
  );
};

export default GlobalRadarCard;

