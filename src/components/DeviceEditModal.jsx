import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import useHAStore from '../stores/haStore';

/**
 * Device Edit Modal
 * Allows editing device name and area
 */
const DeviceEditModal = ({ isOpen, onClose, device }) => {
  const { colors } = useAccentColor();
  const { areas, updateDevice } = useHAStore();
  
  const [formData, setFormData] = useState({
    name_by_user: '',
    area_id: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form data when device changes
  useEffect(() => {
    if (device) {
      setFormData({
        name_by_user: device.name_by_user || '',
        area_id: device.area_id || '',
      });
      setError(null);
    }
  }, [device]);

  if (!isOpen || !device) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Build updates object - only include changed fields
      const updates = {};
      
      if (formData.name_by_user !== (device.name_by_user || '')) {
        updates.name_by_user = formData.name_by_user || null;
      }
      
      if (formData.area_id !== (device.area_id || '')) {
        updates.area_id = formData.area_id || null;
      }

      // Only call update if there are changes
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updateDevice(device.id, updates);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Edit Device</h2>
            <p className="text-sm text-slate-400 mt-1">{device.name || device.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Device Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Manufacturer</p>
                <p className="text-slate-300">{device.manufacturer || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-slate-500">Model</p>
                <p className="text-slate-300">{device.model || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Device Name
            </label>
            <input
              type="text"
              value={formData.name_by_user}
              onChange={(e) => setFormData({ ...formData, name_by_user: e.target.value })}
              placeholder={device.name || 'Device name'}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty to use default name</p>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Area
            </label>
            <select
              value={formData.area_id}
              onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">No area</option>
              {areas.map((area) => (
                <option key={area.area_id} value={area.area_id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceEditModal;

