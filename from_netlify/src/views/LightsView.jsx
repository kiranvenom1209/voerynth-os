import React from 'react';
import {
    Armchair, CircleDot, Gem, Sofa, Utensils, Lightbulb, Sparkles, Cone, ChefHat,
    Bath, LampWallDown, BedDouble, LampDesk, LandPlot, Lamp, TreePine, Layers,
    Sunrise, Building2, Flame, Sunset, Music, Wind, Moon
} from 'lucide-react';
import Card from '../components/Card';
import FanCard from '../components/FanCard';
import LightCard from '../components/LightCard';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import { useAccentColor } from '../context/AccentColorContext';

const LightsView = ({ onColorPicker, editMode = false, onCardEdit = null, cardConfigs = {} }) => {
    const { callService } = useHomeAssistant();
    const { accentColor, colors } = useAccentColor();

    // Helper to get warm gradient based on accent color
    const getWarmGradient = () => {
        const gradientMap = {
            amber: 'from-orange-500/20 to-yellow-500/20 text-amber-400',
            emerald: 'from-green-500/20 to-emerald-500/20 text-emerald-400',
            blue: 'from-sky-500/20 to-blue-500/20 text-blue-400',
            purple: 'from-purple-500/20 to-violet-500/20 text-purple-400',
            rose: 'from-rose-500/20 to-pink-500/20 text-rose-400'
        };
        return gradientMap[accentColor] || gradientMap.amber;
    };

    const rooms = [
        {
            name: 'Living Room',
            icon: Armchair,
            lights: [
                // Mobile ordering: Living Area first
                { id: 'light.ceiling_light_living_room', name: 'Ceiling', icon: CircleDot, brandIcon: 'CeilingRound', mobileOrderClass: 'order-2 md:order-none' }, // Round Hue ceiling light
                { id: 'light.left_light', name: 'TV Left', icon: Gem, brandIcon: 'Iris', mobileOrderClass: 'order-3 md:order-none' }, // Hue Iris
                { id: 'light.living_room_2', name: 'Living Area', icon: Sofa, mobileOrderClass: 'order-1 md:order-none' }, // Group control - TOP
                { id: 'light.right_light', name: 'TV Right', icon: Gem, brandIcon: 'Iris', mobileOrderClass: 'order-4 md:order-none' } // Hue Iris
            ],
            scenes: [
                { id: 'scene.living_room_read', label: 'Warm', icon: Sunrise, gradient: getWarmGradient() },
                { id: 'scene.living_room_tokyo', label: 'Tokyo', icon: Building2, gradient: 'from-pink-500/20 to-purple-500/20 text-pink-400' },
                { id: 'scene.living_room_jazz', label: 'Fireplace', icon: Flame, gradient: 'from-red-900/40 to-orange-900/40 text-red-400' }
            ]
        },
        {
            name: 'Dining Area',
            icon: Utensils,
            lights: [
                // Mobile ordering: Chandelier first
                { id: 'light.dinning_light_1', name: 'Bulb 1', icon: Lightbulb, brandIcon: 'bulbsClassic', mobileOrderClass: 'order-2 md:order-none' },
                { id: 'light.dinning_light_2', name: 'Bulb 2', icon: Lightbulb, brandIcon: 'bulbsClassic', mobileOrderClass: 'order-3 md:order-none' },
                { id: 'light.dining', name: 'Chandelier', icon: Sparkles, brandIcon: 'chandelier', mobileOrderClass: 'order-1 md:order-none' }, // 3-bulb chandelier - TOP
                { id: 'light.dinning_light_3', name: 'Bulb 3', icon: Lightbulb, brandIcon: 'bulbsClassic', mobileOrderClass: 'order-4 md:order-none' }
            ],
            scenes: [
                { id: 'scene.dining_read', label: 'Warm', icon: Sunrise, gradient: getWarmGradient() },
                { id: 'scene.dining_tokyo', label: 'Tokyo', icon: Building2, gradient: 'from-pink-500/20 to-purple-500/20 text-pink-400' },
                { id: 'scene.dining_jazz_drinking', label: 'Jazz', icon: Music, gradient: 'from-blue-900/40 to-indigo-900/40 text-blue-300' }
            ]
        },
        {
            name: 'Kitchen',
            icon: ChefHat,
            lights: [
                // Mobile ordering: Main Spots first
                { id: 'light.kitchen_light_1', name: 'Spot 1', icon: Cone, brandIcon: 'bulbsSpot', mobileOrderClass: 'order-2 md:order-none' },
                { id: 'light.kitchen_light_2', name: 'Spot 2', icon: Cone, brandIcon: 'bulbsSpot', mobileOrderClass: 'order-3 md:order-none' },
                { id: 'light.kitchen', name: 'Main Spots', icon: ChefHat, mobileOrderClass: 'order-1 md:order-none' }, // Group control - TOP
                { id: 'light.kitchen_light_3', name: 'Spot 3', icon: Cone, brandIcon: 'bulbsSpot', mobileOrderClass: 'order-4 md:order-none' }
            ],
            scenes: [
                { id: 'scene.kitchen_read', label: 'Warm', icon: Sunrise, gradient: getWarmGradient() },
                { id: 'scene.kitchen_concentrate', label: 'Cool', icon: Wind, gradient: 'from-blue-400/20 to-cyan-400/20 text-cyan-400' }
            ]
        },
        {
            name: 'Sanctuary', // Bath/Toilet
            icon: Bath,
            lights: [
                { id: 'light.bathroom', name: 'Main Light', icon: LampWallDown } // Wall-mounted light
            ],
            scenes: []
        },
        {
            name: 'Bedroom',
            icon: BedDouble,
            hasEnv: true,
            lights: [
                { id: 'light.bedroom', name: 'Main', icon: BedDouble }, // Group control - TOP LEFT (beside Dreo)
                { id: 'light.l_bedside_lamp', name: 'Bedside L', icon: LampDesk, brandIcon: 'DeskLamp' }, // Bedside lamp
                { id: 'light.bedroom_light', name: 'Ceiling', icon: CircleDot, brandIcon: 'CeilingRound' } // Round Hue ceiling light
            ],
            scenes: [
                { id: 'scene.bedroom_beginnings', label: 'Sleep', icon: Moon, gradient: 'from-indigo-900/50 to-slate-900/50 text-indigo-300' },
                { id: 'scene.bedroom_read', label: 'Warm', icon: Sunrise, gradient: getWarmGradient() },
                { id: 'scene.bedroom_tokyo', label: 'Tokyo', icon: Building2, gradient: 'from-pink-500/20 to-purple-500/20 text-pink-400' },
                { id: 'scene.bedroom_nighttime', label: 'Night', icon: Moon, gradient: 'from-slate-900 to-black text-slate-500' }
            ]
        },
        {
            name: 'Backyard',
            icon: LandPlot,
            lights: [
                // Mobile ordering: Backyard first
                { id: 'light.patio', name: 'Patio', icon: Lamp, mobileOrderClass: 'order-2 md:order-none' }, // Patio lamp
                { id: 'light.on_off_plug_1', name: 'Zone 1', icon: TreePine, mobileOrderClass: 'order-3 md:order-none' },
                { id: 'light.on_off_plug_1_2', name: 'Zone 2', icon: TreePine, mobileOrderClass: 'order-4 md:order-none' },
                { id: 'light.backyard', name: 'Backyard', icon: Layers, mobileOrderClass: 'order-1 md:order-none' } // Group control - TOP
            ],
            scenes: []
        }
    ];

    // Calculate cumulative delays for a smooth waterfall effect
    let cumulativeDelay = 0;
    const roomRenderData = rooms.map(room => {
        const startDelay = cumulativeDelay;
        // Count total items that will be animated in this room
        let itemCount = room.lights.length;
        if (room.hasEnv) itemCount++;
        if (room.scenes.length > 0) itemCount++;

        // Increment delay for the next room (items * stagger + buffer)
        cumulativeDelay += (itemCount * 50) + 100;

        return { ...room, startDelay };
    });

    // Detect desktop view to disable animations if requested
    const [isDesktop, setIsDesktop] = React.useState(false);

    React.useEffect(() => {
        let timeoutId;
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
        };

        const debouncedCheck = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkDesktop, 100);
        };

        checkDesktop(); // Initial check
        window.addEventListener('resize', debouncedCheck);

        return () => {
            window.removeEventListener('resize', debouncedCheck);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="space-y-8 animate-[fadeIn_0.8s_ease-out]">
            {roomRenderData.map((room, rIdx) => (
                <div key={rIdx} className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-800/50 pb-2 transition-colors duration-500">
                        <room.icon className={`${colors.text}/80 transition-all duration-500`} size={20} />
                        <h3 className="font-serif text-lg text-slate-300 transition-colors duration-500">{room.name}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {room.hasEnv && <FanCard
                            delay={room.startDelay}
                            disableAnimation={isDesktop}
                            editMode={editMode}
                            onEditClick={onCardEdit}
                            cardId={`fan-${room.name.toLowerCase().replace(/\s+/g, '-')}`}
                        />}

                        {room.lights.map((lightConfig, index) => {
                            const cardId = `light-${lightConfig.id}`;
                            const savedConfig = cardConfigs[cardId];
                            return (
                                <LightCard
                                    key={lightConfig.id}
                                    lightConfig={lightConfig}
                                    savedConfig={savedConfig}
                                    onColorPicker={onColorPicker}
                                    index={index}
                                    delay={room.startDelay + (index * 50) + (room.hasEnv ? 50 : 0)}
                                    disableAnimation={isDesktop}
                                    editMode={editMode}
                                    onEditClick={onCardEdit}
                                    cardId={cardId}
                                />
                            );
                        })}

                        {room.scenes.length > 0 && (
                            <Card
                                className="flex flex-col justify-center"
                                delay={room.startDelay + (room.lights.length * 50) + (room.hasEnv ? 50 : 0)}
                                disableAnimation={isDesktop}
                                editMode={editMode}
                                onEditClick={onCardEdit}
                                cardId={`scenes-${room.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                <div className="grid grid-cols-2 gap-3 h-full content-center">
                                    {room.scenes.map((scene, sIdx) => (
                                        <button
                                            key={sIdx}
                                            onClick={() => callService('scene', 'turn_on', { entity_id: scene.id })}
                                            className={`group relative overflow-hidden flex flex-col items-center justify-center gap-1 py-3 rounded-lg border border-white/5 bg-gradient-to-br ${scene.gradient} transition-all duration-300 hover:border-white/10`}
                                        >
                                            <scene.icon size={16} className="relative z-10 transition-transform duration-300" />
                                            <span className="relative z-10 text-[10px]  tracking-wider">{scene.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LightsView;
