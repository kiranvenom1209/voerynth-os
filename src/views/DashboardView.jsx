import React from 'react';
import {
  DashboardHeader,
  NeuralInterfaceCard,
  WeatherCard,
  QuickModeSelector,
  TransitCard,
  EnergyFlowCard,
  ResidentsCard,
  LiveLocationCard,
  GlobalRadarCard
} from '../components/dashboard';

const DashboardView = ({ editMode = false, onCardEdit = null }) => {
  return (
    <div className="space-y-5 md:space-y-7">
      {/* Header with greeting and time */}
      <DashboardHeader />

      {/* Quick Mode Selector */}
      <QuickModeSelector />

      {/* Neural Interface & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <NeuralInterfaceCard delay={100} editMode={editMode} onEditClick={onCardEdit} cardId="neural-interface" />
        <WeatherCard delay={150} editMode={editMode} onEditClick={onCardEdit} cardId="weather" />
      </div>

      {/* Transit & Live Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TransitCard delay={200} editMode={editMode} onEditClick={onCardEdit} cardId="transit" />
        <GlobalRadarCard delay={300} editMode={editMode} onEditClick={onCardEdit} cardId="global-radar" />
      </div>

      {/* Live Location Tracker */}
      <div className="grid grid-cols-1 gap-6">
        <LiveLocationCard delay={325} editMode={editMode} onEditClick={onCardEdit} cardId="live-location" />
      </div>

      {/* Energy & Residents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EnergyFlowCard delay={350} editMode={editMode} onEditClick={onCardEdit} cardId="energy-flow" />
        <ResidentsCard delay={400} editMode={editMode} onEditClick={onCardEdit} cardId="residents" />
      </div>
    </div>
  );
};

export default DashboardView;
