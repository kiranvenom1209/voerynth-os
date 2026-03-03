import React, { useMemo } from 'react';
import { Plus, ToggleLeft, Hash, Calendar, Clock, ListOrdered, Sliders, FileText } from 'lucide-react';
import { useAccentColor } from '../../../context/AccentColorContext';
import useHAStore from '../../../stores/haStore';

/**
 * Helpers Tab
 * Shows all helper entities (input_boolean, input_number, etc.)
 */
const HelpersTab = () => {
  const { colors } = useAccentColor();
  const { hassStates } = useHAStore();

  // Get all helper entities
  const helpers = useMemo(() => {
    if (!hassStates) return [];
    
    const helperDomains = [
      'input_boolean',
      'input_number',
      'input_text',
      'input_select',
      'input_datetime',
      'input_button',
      'counter',
      'timer'
    ];

    return Object.values(hassStates)
      .filter(entity => helperDomains.some(domain => entity.entity_id.startsWith(domain + '.')))
      .sort((a, b) => (a.attributes.friendly_name || a.entity_id).localeCompare(b.attributes.friendly_name || b.entity_id));
  }, [hassStates]);

  // Group helpers by type
  const helpersByType = useMemo(() => {
    const grouped = {};
    helpers.forEach(helper => {
      const domain = helper.entity_id.split('.')[0];
      if (!grouped[domain]) {
        grouped[domain] = [];
      }
      grouped[domain].push(helper);
    });
    return grouped;
  }, [helpers]);

  const getHelperIcon = (domain) => {
    const icons = {
      input_boolean: ToggleLeft,
      input_number: Hash,
      input_text: FileText,
      input_select: ListOrdered,
      input_datetime: Calendar,
      input_button: Sliders,
      counter: Hash,
      timer: Clock
    };
    return icons[domain] || Sliders;
  };

  const getHelperTypeName = (domain) => {
    const names = {
      input_boolean: 'Toggle',
      input_number: 'Number',
      input_text: 'Text',
      input_select: 'Dropdown',
      input_datetime: 'Date/Time',
      input_button: 'Button',
      counter: 'Counter',
      timer: 'Timer'
    };
    return names[domain] || domain;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Helpers</h2>
          <p className="text-sm text-slate-400 mt-1">{helpers.length} helpers configured</p>
        </div>
        <button
          className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          <Plus className="w-4 h-4" />
          Create Helper
        </button>
      </div>

      {/* Helpers List */}
      {helpers.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <Sliders className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No helpers found</h3>
          <p className="text-slate-500 mb-6">
            Helpers are entities you can use to store values or trigger automations
          </p>
          <button
            className="px-6 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Helper
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(helpersByType).map(([domain, domainHelpers]) => {
            const Icon = getHelperIcon(domain);
            const typeName = getHelperTypeName(domain);

            return (
              <div key={domain}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-300">
                    {typeName} ({domainHelpers.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {domainHelpers.map(helper => (
                    <div
                      key={helper.entity_id}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-slate-100 font-medium">
                            {helper.attributes.friendly_name || helper.entity_id}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span className="font-mono text-xs">{helper.entity_id}</span>
                            <span>•</span>
                            <span>
                              {domain === 'input_boolean' && (helper.state === 'on' ? 'On' : 'Off')}
                              {domain === 'input_number' && `${helper.state} ${helper.attributes.unit_of_measurement || ''}`}
                              {domain === 'input_text' && (helper.state || 'Empty')}
                              {domain === 'input_select' && helper.state}
                              {domain === 'input_datetime' && helper.state}
                              {domain === 'counter' && helper.state}
                              {domain === 'timer' && helper.state}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HelpersTab;

