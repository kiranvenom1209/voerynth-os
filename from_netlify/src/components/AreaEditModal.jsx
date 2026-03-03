import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Trash2 } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import useHAStore from '../stores/haStore';

/**
 * Area Edit Modal
 * Allows creating, editing, and deleting areas
 */
const AreaEditModal = ({ isOpen, onClose, area, isNew = false }) => {
  const { colors } = useAccentColor();
  const { createArea, updateArea, deleteArea } = useHAStore();
  
  const [formData, setFormData] = useState({
    name: '',
    aliases: '',
    icon: '',
    picture: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data when area changes
  useEffect(() => {
    if (area && !isNew) {
      setFormData({
        name: area.name || '',
        aliases: area.aliases?.join(', ') || '',
        icon: area.icon || '',
        picture: area.picture || '',
      });
      setError(null);
      setShowDeleteConfirm(false);
    } else if (isNew) {
      setFormData({
        name: '',
        aliases: '',
        icon: '',
        picture: '',
      });
      setError(null);
    }
  }, [area, isNew]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate name
      if (!formData.name.trim()) {
        setError('Area name is required');
        setSaving(false);
        return;
      }

      // Build data object
      const data = {
        name: formData.name.trim(),
      };

      // Add optional fields if provided
      if (formData.aliases.trim()) {
        data.aliases = formData.aliases.split(',').map(a => a.trim()).filter(a => a);
      }
      
      if (formData.icon.trim()) {
        data.icon = formData.icon.trim();
      }
      
      if (formData.picture.trim()) {
        data.picture = formData.picture.trim();
      }

      if (isNew) {
        await createArea(data);
      } else {
        await updateArea(area.area_id, data);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isNew ? 'create' : 'update'} area`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      await deleteArea(area.area_id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete area');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              {isNew ? 'Create Area' : 'Edit Area'}
            </h2>
            {!isNew && area && (
              <p className="text-sm text-slate-400 mt-1">{area.name}</p>
            )}
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
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Living Room"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Aliases */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Aliases
            </label>
            <input
              type="text"
              value={formData.aliases}
              onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
              placeholder="Lounge, Family Room"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated alternative names</p>
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
              placeholder="mdi:sofa"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Material Design Icon (e.g., mdi:sofa)</p>
          </div>

          {/* Picture */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Picture URL
            </label>
            <input
              type="text"
              value={formData.picture}
              onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
              placeholder="/local/images/living_room.jpg"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-slate-500 mt-1">Optional background image</p>
          </div>

          {/* Delete Confirmation */}
          {!isNew && showDeleteConfirm && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm mb-3">
                Are you sure you want to delete this area? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          {!isNew && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <div className={`flex items-center gap-3 ${isNew || showDeleteConfirm ? 'ml-auto' : ''}`}>
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {!showDeleteConfirm && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors disabled:opacity-50`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaEditModal;

