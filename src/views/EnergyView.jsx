import React from 'react';
import { TrendingUp, TrendingDown, Factory, ArrowRight, ArrowLeft, Home, Leaf, Zap, ArrowDown, ArrowUp, Flame } from 'lucide-react';
import Card from '../components/Card';
import { useHassEntity } from '../context/HomeAssistantContext';

const EnergyView = ({ particleCount = 3, editMode = false, onCardEdit = null }) => {
    // Get daily energy from utility meter helpers (in kWh)
    const dailyEnergyIn = useHassEntity('sensor.eleused', { state: 0 });
    const dailyEnergyOut = useHassEntity('sensor.daily_energy_export', { state: 0 });

    const co2Intensity = useHassEntity('sensor.electricity_maps_co2_intensity', { state: 0 });
    const fossilFuel = useHassEntity('sensor.electricity_maps_grid_fossil_fuel_percentage', { state: 0 });

    // Parse daily energy values from utility meter helpers (kWh)
    const displayInValue = parseFloat(dailyEnergyIn.state) || 0;
    const displayOutValue = parseFloat(dailyEnergyOut.state) || 0;
    const displayUnit = 'kWh';
    const displayLabel = 'Today';

    const netPower = displayInValue - displayOutValue;
    const isImporting = netPower > 0;
    const isExporting = netPower < 0;

    // Calculate percentages for visual bars
    const maxPower = Math.max(displayInValue, displayOutValue, 1);
    const powerInPercent = (displayInValue / maxPower) * 100;
    const powerOutPercent = (displayOutValue / maxPower) * 100;

    // CO2 color coding
    const co2Value = parseFloat(co2Intensity.state) || 0;
    let co2Color = 'text-emerald-400';
    if (co2Value > 300) co2Color = 'text-amber-400';
    if (co2Value > 500) co2Color = 'text-red-400';

    // Fossil fuel color coding
    const fossilValue = parseFloat(fossilFuel.state) || 0;
    let fossilColor = 'text-emerald-400';
    if (fossilValue > 50) fossilColor = 'text-amber-400';
    if (fossilValue > 75) fossilColor = 'text-red-400';

    return (
        <div className="space-y-8 animate-[fadeIn_0.8s_ease-out]">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif text-slate-200">Energy Dashboard</h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time power flow & environmental impact</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isImporting ? 'bg-amber-500/10 border-amber-500/30' : isExporting ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    {isImporting && <TrendingUp className="text-amber-400" size={16} />}
                    {isExporting && <TrendingDown className="text-emerald-400" size={16} />}
                    <span className={`text-xs  tracking-widest ${isImporting ? 'text-amber-400' : isExporting ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {isImporting ? 'Importing' : isExporting ? 'Exporting' : 'Balanced'}
                    </span>
                </div>
            </div>

            {/* Animated Energy Flow Diagram */}
            <Card title="Energy Flow" subtitle="Daily Consumption Tracking" className="relative overflow-hidden" editMode={editMode} onEditClick={onCardEdit} cardId="energy-flow">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-amber-500/5 opacity-50 pointer-events-none"></div>

                <div className="relative z-10 py-8">
                    {/* Flow Diagram */}
                    <div className="flex items-center justify-between gap-8 px-4">
                        {/* Grid Source */}
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center backdrop-blur-sm">
                                    <Factory size={40} className="text-amber-400" />
                                </div>
                                {isImporting && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-[pulse_2s_infinite] shadow-[0_0_20px_rgba(251,191,36,0.6)]"></div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-slate-500 tracking-widest mb-1">Grid</div>
                                <div className="text-2xl  text-amber-400">{displayInValue.toFixed(1)}</div>
                                <div className="text-[10px] text-slate-500">{displayUnit} {displayLabel}</div>
                            </div>
                        </div>

                        {/* Animated Flow Lines */}
                        <div className="flex-1 relative h-24 flex items-center">
                            {/* Base Line */}
                            <div className="w-full h-0.5 bg-slate-800/50 rounded-full relative">
                                {isImporting && (
                                    <>
                                        {/* Gradient Line */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/40 via-amber-400/60 to-emerald-500/40 rounded-full blur-[1px]"></div>

                                        {/* Flowing Particles - Grid to Home */}
                                        {[...Array(particleCount)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute top-1/2"
                                                style={{
                                                    animation: `flowParticle var(--particle-animation-duration, 4s) ease-in-out infinite`,
                                                    animationDelay: `${i * 1.3}s`
                                                }}
                                            >
                                                <div className="relative">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300 blur-[0.5px]"></div>
                                                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {isExporting && (
                                    <>
                                        {/* Gradient Line */}
                                        <div className="absolute inset-0 bg-gradient-to-l from-amber-500/40 via-emerald-400/60 to-emerald-500/40 rounded-full blur-[1px]"></div>

                                        {/* Flowing Particles - Home to Grid */}
                                        {[...Array(particleCount)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute top-1/2"
                                                style={{
                                                    animation: `flowParticleReverse var(--particle-animation-duration, 4s) ease-in-out infinite`,
                                                    animationDelay: `${i * 1.3}s`
                                                }}
                                            >
                                                <div className="relative">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 blur-[0.5px]"></div>
                                                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Flow Direction Arrow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-slate-900/80 backdrop-blur-sm rounded-full p-1">
                                {isImporting && <ArrowRight className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" size={20} />}
                                {isExporting && <ArrowLeft className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" size={20} />}
                            </div>
                        </div>

                        {/* Estate */}
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                                    <Home size={40} className="text-emerald-400" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-[pulse_2s_infinite] shadow-[0_0_20px_rgba(16,185,129,0.6)]"></div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-slate-500 tracking-widest mb-1">Estate</div>
                                <div className="text-2xl  text-emerald-400">{Math.abs(netPower).toFixed(1)}</div>
                                <div className="text-[10px] text-slate-500">{displayUnit} {isImporting ? 'Used' : 'Produced'} {displayLabel}</div>
                            </div>
                        </div>

                        {/* Export Flow (if applicable) */}
                        {displayOutValue > 0 && (
                            <>
                                <div className="flex-1 relative h-24 flex items-center">
                                    {/* Base Line */}
                                    <div className="w-full h-0.5 bg-slate-800/50 rounded-full relative">
                                        {/* Gradient Line */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 via-emerald-400/60 to-amber-500/40 rounded-full blur-[1px]"></div>

                                        {/* Flowing Particles - Home to Export */}
                                        <div className="absolute inset-0">
                                            {[...Array(3)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute top-1/2 -translate-y-1/2 left-0"
                                                    style={{
                                                        '--flow-distance': '100%',
                                                        animation: `flowParticle 4s ease-in-out infinite`,
                                                        animationDelay: `${i * 1.3}s`
                                                    }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 blur-[0.5px]"></div>
                                                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Flow Direction Arrow */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-slate-900/80 backdrop-blur-sm rounded-full p-1">
                                        <ArrowRight className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" size={20} />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3 flex-1">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                                            <Leaf size={40} className="text-emerald-400" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-[pulse_2s_infinite] shadow-[0_0_20px_rgba(16,185,129,0.6)]"></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 tracking-widest mb-1">Export</div>
                                        <div className="text-2xl  text-emerald-400">{displayOutValue.toFixed(1)}</div>
                                        <div className="text-[10px] text-slate-500">{displayUnit} {displayLabel}</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Net Power Display */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <Zap className={isImporting ? 'text-amber-400' : 'text-emerald-400'} size={20} />
                            <div>
                                <div className="text-xs text-slate-500 tracking-widest">Net Energy</div>
                                <div className={`text-xl  ${isImporting ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {isImporting ? '+' : ''}{netPower.toFixed(2)} {displayUnit}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Power Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Grid Import" subtitle="Used Today" className="relative overflow-hidden" editMode={editMode} onEditClick={onCardEdit} cardId="energy-grid-import">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <ArrowDown size={28} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-3xl  text-slate-100">{displayInValue.toFixed(2)}</div>
                                <div className="text-xs text-slate-500">kilowatt-hours</div>
                            </div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" style={{ width: `${powerInPercent}%` }}></div>
                        </div>
                    </div>
                </Card>

                <Card title="Grid Export" subtitle="Exported Today" className="relative overflow-hidden" editMode={editMode} onEditClick={onCardEdit} cardId="energy-grid-export">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <ArrowUp size={28} className="text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-3xl  text-slate-100">{displayOutValue.toFixed(2)}</div>
                                <div className="text-xs text-slate-500">kilowatt-hours</div>
                            </div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500" style={{ width: `${powerOutPercent}%` }}></div>
                        </div>
                    </div>
                </Card>

                <Card title="CO₂ Intensity" subtitle="Grid Carbon" className="relative overflow-hidden" editMode={editMode} onEditClick={onCardEdit} cardId="energy-co2">
                    <div className={`absolute top-0 right-0 w-32 h-32 ${co2Value > 500 ? 'bg-red-500/10' : co2Value > 300 ? 'bg-amber-500/10' : 'bg-emerald-500/10'} rounded-full blur-3xl`}></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-14 h-14 rounded-xl ${co2Value > 500 ? 'bg-red-500/20' : co2Value > 300 ? 'bg-amber-500/20' : 'bg-emerald-500/20'} flex items-center justify-center`}>
                                <Leaf size={28} className={co2Color} />
                            </div>
                            <div>
                                <div className={`text-3xl  ${co2Color}`}>{co2Value.toFixed(0)}</div>
                                <div className="text-xs text-slate-500">g CO₂/kWh</div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-400">
                            {co2Value < 200 && '🌱 Very Clean'}
                            {co2Value >= 200 && co2Value < 400 && '✓ Clean'}
                            {co2Value >= 400 && co2Value < 600 && '⚠ Moderate'}
                            {co2Value >= 600 && '⚠️ High Carbon'}
                        </div>
                    </div>
                </Card>

                <Card title="Fossil Fuel" subtitle="Grid Mix" className="relative overflow-hidden" editMode={editMode} onEditClick={onCardEdit} cardId="energy-fossil-fuel">
                    <div className={`absolute top-0 right-0 w-32 h-32 ${fossilValue > 75 ? 'bg-red-500/10' : fossilValue > 50 ? 'bg-amber-500/10' : 'bg-emerald-500/10'} rounded-full blur-3xl`}></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-14 h-14 rounded-xl ${fossilValue > 75 ? 'bg-red-500/20' : fossilValue > 50 ? 'bg-amber-500/20' : 'bg-emerald-500/20'} flex items-center justify-center`}>
                                <Flame size={28} className={fossilColor} />
                            </div>
                            <div>
                                <div className={`text-3xl  ${fossilColor}`}>{fossilValue.toFixed(0)}%</div>
                                <div className="text-xs text-slate-500">fossil sources</div>
                            </div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${fossilValue > 75 ? 'bg-gradient-to-r from-red-500 to-orange-500' : fossilValue > 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'}`} style={{ width: `${fossilValue}%` }}></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default EnergyView;
