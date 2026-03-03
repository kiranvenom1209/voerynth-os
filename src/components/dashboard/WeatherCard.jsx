import React from 'react';
import { Sun, Moon, Wind } from 'lucide-react';
import Card from '../Card';
import { useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';

const WeatherCard = ({ delay = 150, editMode = false, onEditClick = null, cardId = null }) => {
  const { colors } = useAccentColor();
  
  const outdoorTemp = useHassEntity('sensor.forecast_current_temperature', { state: '18.5' });
  const outdoorHum = useHassEntity('sensor.forecast_current_humidity', { state: '45' });
  const aqi = useHassEntity('sensor.air_quality_index', { state: '12' });
  const sunEntity = useHassEntity('sun.sun', { state: 'below_horizon' });
  const windSpeed = useHassEntity('sensor.forecast_current_wind_speed', { state: '0' });
  const windBearing = useHassEntity('sensor.forecast_current_wind_bearing', { state: '0' });
  
  const isAboveHorizon = sunEntity.state === 'above_horizon';
  const bearingNum = parseFloat(windBearing.state);

  // Convert bearing to compass direction
  const getDirection = (bearing) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const direction = !isNaN(bearingNum) ? getDirection(bearingNum) : 'N';

  return (
    <Card title="Schmalkalden Climate" subtitle="Local Conditions" delay={delay} editMode={editMode} onEditClick={onEditClick} cardId={cardId}>
      <div className="flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-4xl font-kumbh font-thin text-slate-100">{outdoorTemp.state}°</div>
            <div className="text-xs font-kumbh text-slate-500 tracking-wider mt-1">Outdoor</div>
          </div>
          {isAboveHorizon ? (
            <Sun className={`${colors.text} w-10 h-10`} />
          ) : (
            <Moon className="text-indigo-400 w-10 h-10" />
          )}
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
            <span className="font-kumbh text-slate-500">Sun</span>
            <span className={`${colors.text400} font-kumbh flex items-center gap-1`}>
              {isAboveHorizon ? 'Above Horizon' : 'Below Horizon'}
            </span>
          </div>
          <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
            <span className="font-kumbh text-slate-500">Humidity</span>
            <span className="font-kumbh text-slate-300">{outdoorHum.state}%</span>
          </div>
          <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
            <span className="font-kumbh text-slate-500">Wind</span>
            <span className="font-kumbh text-cyan-400 flex items-center gap-1">
              <Wind size={12} style={{ transform: `rotate(${bearingNum}deg)` }} />
              {windSpeed.state} km/h {direction}
            </span>
          </div>
          <div className="flex justify-between text-sm border-b border-slate-800 pb-2">
            <span className="font-kumbh text-slate-500">Air Quality</span>
            <span className="font-kumbh text-emerald-400">{aqi.state}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WeatherCard;

