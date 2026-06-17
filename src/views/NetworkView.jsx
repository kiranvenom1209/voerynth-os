import React from 'react';
import { Cpu, HardDrive, Wifi, Zap, Leaf } from 'lucide-react';
import Card from '../components/Card';
import { useHassEntity } from '../context/HomeAssistantContext';
import estateEntities from '../config/estateEntities';

const NetworkView = ({ editMode = false, onCardEdit = null }) => {
    const networkConfig = estateEntities.network;
    const cpu = useHassEntity(networkConfig.cpu, { state: 12 });
    const mem = useHassEntity(networkConfig.memory, { state: 45 });

    // Speedtest
    const down = useHassEntity(networkConfig.download, { state: 0 });

    // Energy
    const powerIn = useHassEntity(networkConfig.gridImport, { state: 0 });
    const powerOut = useHassEntity(networkConfig.gridExport, { state: 0 });
    const co2 = useHassEntity(networkConfig.co2Intensity, { state: 0 });

    return (
        <div className="space-y-6 animate-[fadeIn_0.8s_ease-out]">
            <h2 className="text-2xl font-serif text-slate-200 px-2">System & Grid Telemetry</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Processor" subtitle="Core Load" editMode={editMode} onEditClick={onCardEdit} cardId="network-processor">
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-4xl font-thin font-kumbh text-slate-100">{cpu.state}%</span>
                        <Cpu size={24} className="text-blue-500 mb-2" />
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${cpu.state}%` }}></div>
                    </div>
                </Card>
                <Card title="Memory" subtitle="RAM Usage" editMode={editMode} onEditClick={onCardEdit} cardId="network-memory">
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-4xl font-thin font-kumbh text-slate-100">{mem.state}%</span>
                        <HardDrive size={24} className="text-purple-500 mb-2" />
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${mem.state}%` }}></div>
                    </div>
                </Card>
                <Card title="Throughput" subtitle="Download" editMode={editMode} onEditClick={onCardEdit} cardId="network-throughput">
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-4xl font-thin font-kumbh text-slate-100">{down.state}</span>
                        <Wifi size={24} className="text-emerald-500 mb-2" />
                    </div>
                    <span className="text-xs text-slate-500">Mbps</span>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Grid Consumption" subtitle="Total Import" editMode={editMode} onEditClick={onCardEdit} cardId="network-grid-consumption">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-amber-500">
                            <Zap size={32} />
                        </div>
                        <div>
                            <div className="text-2xl  text-slate-200">{powerIn.state} kWh</div>
                            <div className="text-xs text-slate-500">Carbon Intensity: {co2.state} gCO2/kWh</div>
                        </div>
                    </div>
                </Card>
                <Card title="Grid Export" subtitle="Solar Return" editMode={editMode} onEditClick={onCardEdit} cardId="network-grid-export">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-green-500">
                            <Leaf size={32} />
                        </div>
                        <div>
                            <div className="text-2xl  text-slate-200">{powerOut.state} kWh</div>
                            <div className="text-xs text-slate-500">Fed to Grid</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default NetworkView;
