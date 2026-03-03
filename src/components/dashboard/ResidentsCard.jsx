import React, { useEffect } from 'react';
import { Users, MapPin, Battery } from 'lucide-react';
import Card from '../Card';
import { useHassEntity } from '../../context/HomeAssistantContext';
import { renderPersonIcon } from '../../utils/randomIcon';
import usePeopleStore from '../../stores/peopleStore';
import { formatState } from '../../utils/utils';

const ResidentItem = ({ person, idx }) => {
  const personEntity = useHassEntity(person.entity, { state: 'unknown' });
  const batteryEntity = useHassEntity(person.phone, { state: '0' });
  const { getCustomIcon } = usePeopleStore();
  const isHome = personEntity.state === 'home';
  const customIcon = getCustomIcon(person.entity);

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-500 opacity-0 animate-[slideUpFade_0.6s_ease-out_forwards] ${isHome
        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]'
        : 'bg-slate-800/50 border-slate-700/50'
        }`}
      style={{ animationDelay: `${idx * 100}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isHome ? 'bg-emerald-500/20' : 'bg-slate-700'
          }`}>
          {renderPersonIcon(
            person.name,
            {
              size: 18,
              className: isHome ? 'text-emerald-400' : 'text-slate-500'
            },
            customIcon
          )}
        </div>
        <div>
          <div className="text-sm font-kumbh text-slate-200">{person.name}</div>
          <div className="text-[10px] font-kumbh text-slate-500 tracking-wider flex items-center gap-1">
            <MapPin size={10} />
            {formatState(personEntity.state)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Battery
          size={12}
          className={parseInt(batteryEntity.state) < 20 ? 'text-red-400' : 'text-slate-400'}
        />
        <span className="font-kumbh text-slate-400">{batteryEntity.state}%</span>
      </div>
    </div>
  );
};

const ResidentsCard = ({ delay = 400, editMode = false, onEditClick = null, cardId = null }) => {
  const { initialize } = usePeopleStore();

  // Initialize people store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const kiranEntity = useHassEntity('person.kiran', { state: 'unknown' });
  const isKiranHome = kiranEntity.state?.toLowerCase() === 'home';

  const residents = [
    { name: 'Kiran', entity: 'person.kiran', phone: 'sensor.kiran_s_phone_battery_level' },
    { name: 'Danny', entity: 'person.danny', phone: 'sensor.danny_s_phone_battery_level' },
    // Only show Home Server (Ayanthiara) when Kiran is away, and rename it to "Home"
    ...(!isKiranHome ? [{ name: 'Home', entity: 'person.ayanthiara', phone: 'sensor.xiaomi_pad_5_battery' }] : [])
  ];

  return (
    <Card
      title="Residents"
      subtitle="Location Tracking"
      delay={delay}
      className="lg:col-span-2"
      editMode={editMode}
      onEditClick={onEditClick}
      cardId={cardId}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {residents.map((person, idx) => (
          <ResidentItem key={person.name} person={person} idx={idx} />
        ))}
      </div>
    </Card>
  );
};

export default ResidentsCard;

