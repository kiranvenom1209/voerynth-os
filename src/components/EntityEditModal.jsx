import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import useHAStore from '../stores/haStore';

/**
 * Entity Edit Modal
 * Allows editing entity name, icon, area, and entity_id
 */
const EntityEditModal = ({ isOpen, onClose, entity }) => {
  const { colors } = useAccentColor();
  const { areas, updateEntity } = useHAStore();
  
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    area_id: '',
    new_entity_id: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showEntityIdWarning, setShowEntityIdWarning] = useState(false);

  // Initialize form data when entity changes
  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        icon: entity.icon || '',
        area_id: entity.area_id || '',
        new_entity_id: entity.entity_id || '',
      });
      setShowEntityIdWarning(false);
      setError(null);
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Build updates object - only include changed fields
      const updates = {};
      
      if (formData.name !== (entity.name || '')) {
        updates.name = formData.name || null;
      }
      
      if (formData.icon !== (entity.icon || '')) {
        updates.icon = formData.icon || null;
      }
      
      if (formData.area_id !== (entity.area_id || '')) {
        updates.area_id = formData.area_id || null;
      }
      
      if (formData.new_entity_id !== entity.entity_id) {
        updates.new_entity_id = formData.new_entity_id;
      }

      // Only call update if there are changes
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updateEntity(entity.entity_id, updates);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update entity');
    } finally {
      setSaving(false);
    }
  };

  const handleEntityIdChange = (value) => {
    setFormData({ ...formData, new_entity_id: value });
    setShowEntityIdWarning(value !== entity.entity_id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Edit Entity</h2>
            <p className="text-sm text-slate-400 mt-1">{entity.entity_id}</p>
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={entity.original_name || entity.entity_id}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty to use default name</p>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Icon
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="mdi:lightbulb"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Material Design Icon (e.g., mdi:lightbulb)</p>
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

          {/* Entity ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Entity ID
            </label>
            <input
              type="text"
              value={formData.new_entity_id}
              onChange={(e) => handleEntityIdChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            {showEntityIdWarning && (
              <div className="mt-2 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400">
                  Warning: Changing the entity ID will break automations and scripts that reference this entity.
                </p>
              </div>
            )}
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

export default EntityEditModal;

