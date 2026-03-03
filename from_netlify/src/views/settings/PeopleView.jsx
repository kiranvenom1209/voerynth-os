import React, { useMemo, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Users, MapPin, Smartphone, Edit, Trash2 } from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import useHAStore from '../../stores/haStore';
import usePeopleStore from '../../stores/peopleStore';
import { renderPersonIcon } from '../../utils/randomIcon';
import IconPicker from '../../components/IconPicker';

/**
 * People View
 * Manage people and presence detection
 */
const PeopleView = () => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { statesByEntityId, areas, areasById } = useHAStore();
  const { customIcons, initialize, setCustomIcon, getCustomIcon } = usePeopleStore();
  const [activeTab, setActiveTab] = useState('people');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Initialize people store
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Get all person entities
  const people = useMemo(() => {
    if (!statesByEntityId) return [];
    return Object.values(statesByEntityId)
      .filter(entity => entity.entity_id.startsWith('person.'))
      .sort((a, b) => (a.attributes?.friendly_name || a.entity_id).localeCompare(b.attributes?.friendly_name || b.entity_id));
  }, [statesByEntityId]);

  // Get all device trackers
  const deviceTrackers = useMemo(() => {
    if (!statesByEntityId) return [];
    return Object.values(statesByEntityId)
      .filter(entity => entity.entity_id.startsWith('device_tracker.'))
      .sort((a, b) => (a.attributes?.friendly_name || a.entity_id).localeCompare(b.attributes?.friendly_name || b.entity_id));
  }, [statesByEntityId]);

  // Get all zones
  const zones = useMemo(() => {
    if (!statesByEntityId) return [];
    return Object.values(statesByEntityId)
      .filter(entity => entity.entity_id.startsWith('zone.'))
      .sort((a, b) => (a.attributes?.friendly_name || a.entity_id).localeCompare(b.attributes?.friendly_name || b.entity_id));
  }, [statesByEntityId]);

  const getLocationDisplay = (state, attributes) => {
    if (state === 'home') return 'Home';
    if (state === 'not_home') return 'Away';
    // Check if it's an area
    const area = areas.find(a => a.name.toLowerCase() === state.toLowerCase());
    if (area) return area.name;
    return state;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 sm:p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-100 truncate">People</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 truncate">
              {people.length} people • {deviceTrackers.length} device trackers
            </p>
          </div>
        </div>
        <button
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 text-sm sm:text-base"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add Person</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 -mx-3 sm:mx-0">
        <div className="flex gap-0.5 sm:gap-2 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('people')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
            style={activeTab === 'people' ? { borderColor: colors.accent, color: colors.accent } : { borderColor: 'transparent', color: '#94a3b8' }}
          >
            People ({people.length})
          </button>
          <button
            onClick={() => setActiveTab('trackers')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors hover:text-slate-300 whitespace-nowrap flex-shrink-0"
            style={activeTab === 'trackers' ? { borderColor: colors.accent, color: colors.accent } : { borderColor: 'transparent', color: '#94a3b8' }}
          >
            Device Trackers ({deviceTrackers.length})
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors hover:text-slate-300 whitespace-nowrap flex-shrink-0"
            style={activeTab === 'zones' ? { borderColor: colors.accent, color: colors.accent } : { borderColor: 'transparent', color: '#94a3b8' }}
          >
            Zones ({zones.length})
          </button>
        </div>
      </div>

      {/* People List */}
      {activeTab === 'people' && (
        <div className="space-y-3">
        {people.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No people found</h3>
            <p className="text-slate-500 mb-6">Add people to track presence in your home</p>
            <button
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Person
            </button>
          </div>
        ) : (
          people.map(person => {
            const isHome = person.state === 'home';
            const location = getLocationDisplay(person.state, person.attributes);
            
            return (
              <div
                key={person.entity_id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        {renderPersonIcon(
                          person.attributes.friendly_name || person.entity_id,
                          { className: 'w-5 h-5 sm:w-6 sm:h-6 text-slate-400' },
                          getCustomIcon(person.entity_id)
                        )}
                      </div>
                      {/* Status indicator */}
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-slate-800 ${isHome ? 'bg-green-500' : 'bg-slate-500'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base text-slate-100 font-medium truncate">
                        {person.attributes.friendly_name || person.entity_id}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{location}</span>
                        {person.attributes.source && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <Smartphone className="w-3 h-3 flex-shrink-0 hidden sm:inline" />
                            <span className="text-xs truncate hidden sm:inline">{person.attributes.source}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedPerson(person);
                        setIconPickerOpen(true);
                      }}
                      className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Change Icon"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    </button>
                    <button className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Device Trackers List */}
      {activeTab === 'trackers' && (
        <div className="space-y-3">
          {deviceTrackers.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No device trackers found</h3>
              <p className="text-slate-500">Device trackers will appear here when configured</p>
            </div>
          ) : (
            deviceTrackers.map(tracker => {
              const isHome = tracker.state === 'home';
              const location = getLocationDisplay(tracker.state, tracker.attributes);

              return (
                <div
                  key={tracker.entity_id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${isHome ? 'bg-green-500/10' : 'bg-slate-700/50'}`}>
                        <Smartphone className={`w-5 h-5 ${isHome ? 'text-green-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-slate-100 font-medium">
                          {tracker.attributes?.friendly_name || tracker.entity_id}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{location}</span>
                          {tracker.attributes?.source_type && (
                            <>
                              <span>•</span>
                              <span className="text-xs">{tracker.attributes.source_type}</span>
                            </>
                          )}
                        </div>
                        {tracker.attributes?.battery_level && (
                          <div className="text-xs text-slate-500 mt-1">
                            Battery: {tracker.attributes.battery_level}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Zones List */}
      {activeTab === 'zones' && (
        <div className="space-y-3">
          {zones.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No zones found</h3>
              <p className="text-slate-500 mb-6">Create zones to track when people enter or leave specific areas</p>
              <button
                onClick={() => {
                  const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
                  window.open(`${haUrl}/config/zone`, '_blank');
                }}
                className="px-6 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Zone
              </button>
            </div>
          ) : (
            zones.map(zone => {
              const radius = zone.attributes?.radius || 0;
              const latitude = zone.attributes?.latitude;
              const longitude = zone.attributes?.longitude;
              const passive = zone.attributes?.passive || false;

              return (
                <div
                  key={zone.entity_id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <MapPin className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-slate-100 font-medium">
                          {zone.attributes?.friendly_name || zone.entity_id}
                        </h3>
                        <div className="text-sm text-slate-400 mt-1">
                          Radius: {radius}m
                          {passive && <span className="ml-2 text-xs text-amber-400">(Passive)</span>}
                        </div>
                        {latitude && longitude && (
                          <div className="text-xs text-slate-500 mt-1">
                            {latitude.toFixed(4)}, {longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
                          window.open(`${haUrl}/config/zone`, '_blank');
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Icon Picker Modal */}
      <IconPicker
        isOpen={iconPickerOpen}
        onClose={() => {
          setIconPickerOpen(false);
          setSelectedPerson(null);
        }}
        onSelect={(iconName) => {
          if (selectedPerson) {
            if (iconName === null) {
              // Reset to random icon by removing custom icon
              const { removeCustomIcon } = usePeopleStore.getState();
              removeCustomIcon(selectedPerson.entity_id);
            } else {
              setCustomIcon(selectedPerson.entity_id, iconName);
            }
          }
        }}
        currentIcon={selectedPerson ? getCustomIcon(selectedPerson.entity_id) : null}
      />
    </div>
  );
};

export default PeopleView;

