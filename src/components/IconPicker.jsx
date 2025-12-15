import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { ICON_NAME_MAP } from '../utils/randomIcon';

const IconPicker = ({ isOpen, onClose, onSelect, currentIcon = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);

  // Update selected icon when currentIcon changes
  React.useEffect(() => {
    setSelectedIcon(currentIcon);
  }, [currentIcon]);

  if (!isOpen) return null;

  // Get all icon names
  const iconNames = Object.keys(ICON_NAME_MAP);

  // Filter icons based on search
  const filteredIcons = iconNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (selectedIcon) {
      onSelect(selectedIcon);
    }
    onClose();
  };

  const handleCancel = () => {
    setSelectedIcon(currentIcon);
    onClose();
  };

  const handleReset = () => {
    setSelectedIcon(null);
    onSelect(null); // Clear the custom icon
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-kumbh font-semibold text-slate-200">Choose an Icon</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = ICON_NAME_MAP[iconName];
              const isSelected = selectedIcon === iconName;

              return (
                <button
                  key={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-3 rounded-lg transition-all hover:scale-110 ${
                    isSelected
                      ? 'bg-emerald-500/20 border-2 border-emerald-500'
                      : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700 hover:border-slate-600'
                  }`}
                  title={iconName}
                >
                  <IconComponent
                    size={24}
                    className={isSelected ? 'text-emerald-400' : 'text-slate-300'}
                  />
                </button>
              );
            })}
          </div>
          
          {filteredIcons.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No icons found matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
              {selectedIcon && (
                <span className="ml-2">• Selected: <span className="text-emerald-400">{selectedIcon}</span></span>
              )}
            </span>
            {currentIcon && (
              <button
                onClick={handleReset}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
              >
                Reset to Random
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedIcon}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconPicker;

