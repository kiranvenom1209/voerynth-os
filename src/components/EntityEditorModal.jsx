import { useState, useEffect } from 'react';
import { X, Save, Search, Lightbulb, Thermometer, Fan, Lock, Camera, Tv, Zap, Activity } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import { useHomeAssistant } from '../context/HomeAssistantContext';

const EntityEditorModal = ({ isOpen, onClose, onSave }) => {
    const { colors } = useAccentColor();
    const { hassStates } = useHomeAssistant();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [entityList, setEntityList] = useState([]);

    useEffect(() => {
        if (hassStates && Object.keys(hassStates).length > 0) {
            const entities = Object.entries(hassStates).map(([entityId, state]) => ({
                id: entityId,
                name: state.attributes?.friendly_name || entityId,
                state: state.state,
                domain: entityId.split('.')[0]
            }));
            setEntityList(entities);
        }
    }, [hassStates]);

    const getEntityIcon = (domain) => {
        const iconMap = {
            light: Lightbulb,
            sensor: Thermometer,
            fan: Fan,
            lock: Lock,
            camera: Camera,
            media_player: Tv,
            switch: Zap,
            binary_sensor: Activity
        };
        return iconMap[domain] || Activity;
    };

    const filteredEntities = entityList.filter(entity =>
        entity.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = () => {
        if (selectedEntity) {
            onSave(selectedEntity);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
            
            <div 
                className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
                    <div>
                        <h2 className="text-xl font-serif text-slate-100">Entity Editor</h2>
                        <p className="text-xs text-slate-500 mt-1">Select an entity to edit</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-800/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search entities..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 outline-none focus:border-slate-600 transition-colors"
                        />
                    </div>
                </div>

                {/* Entity List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredEntities.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Activity size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No entities found</p>
                        </div>
                    ) : (
                        filteredEntities.map((entity) => {
                            const Icon = getEntityIcon(entity.domain);
                            const isSelected = selectedEntity?.id === entity.id;
                            
                            return (
                                <button
                                    key={entity.id}
                                    onClick={() => setSelectedEntity(entity)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                        isSelected
                                            ? `${colors.bg} border ${colors.border}`
                                            : 'bg-slate-950/50 border border-slate-800/50 hover:bg-slate-800/50'
                                    }`}
                                >
                                    <Icon size={20} className={isSelected ? colors.text : 'text-slate-400'} />
                                    <div className="flex-1 text-left">
                                        <div className={`text-sm font-medium ${isSelected ? colors.text : 'text-slate-200'}`}>
                                            {entity.name}
                                        </div>
                                        <div className="text-xs text-slate-500">{entity.id}</div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded ${
                                        entity.state === 'on' ? 'bg-emerald-500/20 text-emerald-400' :
                                        entity.state === 'off' ? 'bg-slate-700/50 text-slate-400' :
                                        'bg-slate-700/50 text-slate-300'
                                    }`}>
                                        {entity.state}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedEntity}
                        className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                            selectedEntity
                                ? `${colors.bg} ${colors.text} ${colors.borderHover} border`
                                : 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <Save size={18} />
                        <span>Save Entity</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EntityEditorModal;

