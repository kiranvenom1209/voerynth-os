import React from 'react';
import { ArrowDown, ArrowUp, Leaf, Flame } from 'lucide-react';
import Card from '../Card';
import { useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';

const EnergyFlowCard = ({ delay = 350, editMode = false, onEditClick = null, cardId = null }) => {
  const { colors } = useAccentColor();
  
  const importEnergy = useHassEntity('sensor.daily_energy_import', { state: '0' });
  const exportEnergy = useHassEntity('sensor.daily_energy_export', { state: '0' });
  const co2Intensity = useHassEntity('sensor.electricity_maps_co2_intensity', { state: '0' });
  const fossilFuel = useHassEntity('sensor.electricity_maps_grid_fossil_fuel_percentage', { state: '0' });

  const importValue = (importEnergy.state === 'unknown' || importEnergy.state === 'unavailable') 
    ? '0.0' : importEnergy.state;
  const exportValue = (exportEnergy.state === 'unknown' || exportEnergy.state === 'unavailable') 
    ? '0.0' : exportEnergy.state;

  return (
    <Card
      title="Energy Flow"
      subtitle="Daily Usage"
      delay={delay}
      className="relative overflow-hidden"
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50 animate-[pulse_4s_infinite] pointer-events-none"></div>
      <div className="space-y-3 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ArrowDown size={14} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-kumbh text-slate-500 tracking-wider">Import Today</div>
              <div className="text-lg font-kumbh text-slate-200">{importValue} kWh</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${colors.bgSoft} flex items-center justify-center`}>
              <ArrowUp size={14} className={colors.text400} />
            </div>
            <div>
              <div className="text-[10px] font-kumbh text-slate-500 tracking-wider">Export Today</div>
              <div className="text-lg font-kumbh text-slate-200">{exportValue} kWh</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Leaf size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-kumbh text-slate-500 tracking-wider">CO₂ Intensity</div>
              <div className="text-xl font-kumbh text-slate-200">{co2Intensity.state} g/kWh</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame size={18} className="text-orange-400" />
            </div>
            <div>
              <div className="text-xs font-kumbh text-slate-500 tracking-wider">Fossil Fuel</div>
              <div className="text-xl font-kumbh text-slate-200">{fossilFuel.state}%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EnergyFlowCard;

