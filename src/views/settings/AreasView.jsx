import React, { useState } from 'react';
import { ArrowLeft, Plus, MapPin, Edit, Trash2, Home } from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import useHAStore from '../../stores/haStore';
import AreaEditModal from '../../components/AreaEditModal';
import getMdiIcon from '../../utils/iconMapper';

/**
 * Areas View
 * Manage all areas in Home Assistant
 */
const AreasView = () => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { areas, devices, entityRegistry, deleteArea } = useHAStore();
  const [editingArea, setEditingArea] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Calculate stats for each area
  const getAreaStats = (areaId) => {
    const areaDevices = devices.filter(d => d.area_id === areaId);
    const areaEntities = entityRegistry.filter(e => e.area_id === areaId);
    return {
      devices: areaDevices.length,
      entities: areaEntities.length
    };
  };

  const handleDelete = async (area) => {
    if (window.confirm(`Are you sure you want to delete the area "${area.name}"?`)) {
      try {
        await deleteArea(area.area_id);
      } catch (error) {
        console.error('Failed to delete area:', error);
        alert('Failed to delete area: ' + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Areas</h1>
            <p className="text-slate-400 mt-1">{areas.length} areas configured</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          <Plus className="w-4 h-4" />
          Create Area
        </button>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.length === 0 ? (
          <div className="col-span-full bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No areas found</h3>
            <p className="text-slate-500 mb-6">Create your first area to organize your home</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create Area
            </button>
          </div>
        ) : (
          areas.map(area => {
            const stats = getAreaStats(area.area_id);
            return (
              <div
                key={area.area_id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      {area.icon ? (
                        getMdiIcon(area.icon, { className: 'w-5 h-5 text-cyan-400' })
                      ) : (
                        <Home className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-slate-100 font-medium">{area.name}</h3>
                      {area.aliases && area.aliases.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Aliases: {area.aliases.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingArea(area)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(area)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>{stats.devices} devices</span>
                  <span>•</span>
                  <span>{stats.entities} entities</span>
                </div>

                {area.picture && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img src={area.picture} alt={area.name} className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit/Create Modal */}
      {(editingArea || isCreating) && (
        <AreaEditModal
          area={editingArea}
          onClose={() => {
            setEditingArea(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};

export default AreasView;

