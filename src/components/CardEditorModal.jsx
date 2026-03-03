import { useState, useEffect } from 'react';
import { X, Save, Search, Lightbulb, Thermometer, Fan, Lock, Camera, Tv, Zap, Activity, Edit3 } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import { useHomeAssistant } from '../context/HomeAssistantContext';

const CardEditorModal = ({ isOpen, onClose, onSave, initialCard }) => {
    const { colors } = useAccentColor();
    const { hassStates } = useHomeAssistant();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [displayName, setDisplayName] = useState('');
    const [cardType, setCardType] = useState('light');
    const [entityList, setEntityList] = useState([]);

    useEffect(() => {
        if (initialCard && isOpen) {
            console.log('📋 Pre-populating card editor with:', initialCard);
            setDisplayName(initialCard.displayName || '');
            setCardType(initialCard.type || 'light');
            if (initialCard.entity) {
                const entityData = hassStates[initialCard.entity];
                if (entityData) {
                    setSelectedEntity({
                        id: initialCard.entity,
                        name: entityData.attributes?.friendly_name || initialCard.entity,
                        state: entityData.state,
                        domain: initialCard.entity.split('.')[0]
                    });
                }
            }
        } else if (!isOpen) {
            // Reset form when modal closes
            setDisplayName('');
            setCardType('light');
            setSelectedEntity(null);
            setSearchQuery('');
        }
    }, [initialCard, isOpen, hassStates]);

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

    const cardTypes = [
        { id: 'light', name: 'Light Control', icon: Lightbulb },
        { id: 'sensor', name: 'Sensor Display', icon: Thermometer },
        { id: 'fan', name: 'Fan Control', icon: Fan },
        { id: 'lock', name: 'Lock Control', icon: Lock },
        { id: 'camera', name: 'Camera Stream', icon: Camera },
        { id: 'media', name: 'Media Player', icon: Tv },
        { id: 'switch', name: 'Switch Control', icon: Zap },
        { id: 'info', name: 'Info Card', icon: Activity }
    ];

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

    // Map card types to entity domains
    const cardTypeToDomain = {
        light: ['light'],
        sensor: ['sensor', 'binary_sensor'],
        fan: ['fan'],
        lock: ['lock'],
        camera: ['camera'],
        media: ['media_player'],
        switch: ['switch', 'input_boolean'],
        info: [] // Info cards can use any entity
    };

    const filteredEntities = entityList.filter(entity => {
        // Filter by search query
        const matchesSearch = entity.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entity.name.toLowerCase().includes(searchQuery.toLowerCase());

        // Filter by card type (only if not 'info' type)
        const allowedDomains = cardTypeToDomain[cardType] || [];
        const matchesDomain = allowedDomains.length === 0 || allowedDomains.includes(entity.domain);

        return matchesSearch && matchesDomain;
    });

    const handleSave = () => {
        if (selectedEntity && displayName && cardType) {
            onSave({
                entity: selectedEntity.id,
                displayName,
                type: cardType
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
            
            <div 
                className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
                    <div>
                        <h2 className="text-xl font-serif text-slate-100">Card Editor</h2>
                        <p className="text-xs text-slate-500 mt-1">Configure card entity, name, and type</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Edit3 size={14} className="inline mr-2" />
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter card display name..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 outline-none focus:border-slate-600 transition-colors"
                        />
                    </div>

                    {/* Card Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">Card Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {cardTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = cardType === type.id;
                                
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setCardType(type.id)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 ${
                                            isSelected
                                                ? `${colors.bg} border-2 ${colors.border}`
                                                : 'bg-slate-950/50 border-2 border-slate-800/50 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <Icon size={24} className={isSelected ? colors.text : 'text-slate-400'} />
                                        <span className={`text-xs ${isSelected ? colors.text : 'text-slate-400'}`}>
                                            {type.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Entity Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">Select Entity</label>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search entities..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 outline-none focus:border-slate-600 transition-colors"
                            />
                        </div>

                        {/* Entity List */}
                        <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-800/50 rounded-lg p-3 bg-slate-950/50">
                            {filteredEntities.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No entities found</p>
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
                                                    : 'bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <Icon size={18} className={isSelected ? colors.text : 'text-slate-400'} />
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
                    </div>
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
                        disabled={!selectedEntity || !displayName || !cardType}
                        className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                            (selectedEntity && displayName && cardType)
                                ? `${colors.bg} ${colors.text} ${colors.borderHover} border`
                                : 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <Save size={18} />
                        <span>Save Card</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CardEditorModal;

