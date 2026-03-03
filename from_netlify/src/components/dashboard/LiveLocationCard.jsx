import React, { useEffect, useState, useMemo } from 'react';
import { useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';
import { MapPin, AlertCircle, X } from 'lucide-react';
import Card from '../Card';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in some bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A helper component to automatically pan/zoom the map to fit all markers
const MapBoundsUpdater = ({ markers }) => {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            // Create a LatLngBounds object encompassing all marker coordinates
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lon]));
            // fitBounds adjusts zoom and center. padding prevents markers from touching the absolute edge of the card.
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12, animate: true, duration: 1.5 });
        }
    }, [markers, map]);

    return null;
};

const LiveLocationCard = ({ delay = 300, editMode = false, onEditClick = null, cardId = null }) => {
    const { colors } = useAccentColor();

    // Fetch the person entities
    const kiran = useHassEntity('person.kiran');
    const danny = useHassEntity('person.danny');
    const ayanthiara = useHassEntity('person.ayanthiara');

    // Parse and validate coordinates. Only include people who have valid GPS data.
    const activeMarkers = useMemo(() => {
        const people = [
            { id: 'kiran', name: 'Kiran', data: kiran },
            { id: 'danny', name: 'Danny', data: danny },
            { id: 'ayanthiara', name: 'Ayanthiara', data: ayanthiara }
        ];

        return people
            .filter(p => p.data?.attributes?.latitude && p.data?.attributes?.longitude)
            .map(p => ({
                id: p.id,
                name: p.name,
                state: p.data.state,
                lat: p.data.attributes.latitude,
                lon: p.data.attributes.longitude
            }));
    }, [kiran, danny, ayanthiara]);

    // Create customized HTML markers (glowing dots matching the accent color)
    const createCustomIcon = (name, state) => {
        const isHome = state.toLowerCase() === 'home';
        const ringColor = isHome ? 'border-emerald-500' : 'border-blue-500';
        const bgBase = isHome ? 'bg-emerald-500/80' : 'bg-blue-500/80';

        const htmlString = `
      <div class="relative flex items-center justify-center pointer-events-none group">
        <div class="absolute -inset-2 rounded-full ${bgBase} blur-md opacity-40 animate-pulse"></div>
        <div class="w-6 h-6 rounded-full border-2 ${ringColor} bg-slate-900 shadow-xl flex items-center justify-center z-10 overflow-hidden">
             <span class="text-[10px] font-bold text-white uppercase tracking-tighter">${name.substring(0, 1)}</span>
        </div>
        <div class="absolute top-8 bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white border border-slate-700 whitespace-nowrap shadow-lg">
           ${name}
        </div>
      </div>
    `;

        return L.divIcon({
            html: htmlString,
            className: 'custom-leaflet-marker', // Keeps default background transparent
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
    };

    return (
        <Card
            delay={delay}
            className="p-0 min-h-[488px] lg:col-span-2 relative overflow-hidden group"
            noPadding
            editMode={editMode}
            onEditClick={() => onEditClick?.(cardId)}
        >
            {activeMarkers.length === 0 ? (
                <div className="w-full h-full min-h-[488px] flex flex-col items-center justify-center bg-slate-900/50">
                    <AlertCircle size={32} className="text-slate-600 mb-3" />
                    <p className="text-slate-400 font-kumbh text-sm">No GPS Telemetry Available</p>
                </div>
            ) : (
                <div className="w-full h-full min-h-[488px] absolute inset-0 z-0">
                    {/* Custom inject CSS to ensure leaflet tiles are dark/inverted further if needed */}
                    <style>
                        {`
                .leaflet-container { 
                    background-color: #020617; 
                    font-family: inherit;
                }
                .leaflet-control-zoom { border: none !important; margin-right: 12px !important; margin-bottom: 12px !important; }
                .leaflet-control-zoom a { 
                    background-color: rgba(15, 23, 42, 0.9) !important; 
                    color: #fff !important; 
                    border-color: rgba(51, 65, 85, 0.5) !important;
                    backdrop-filter: blur(4px);
                }
                .leaflet-control-zoom a:hover { background-color: rgba(30, 41, 59, 1) !important; color: #60a5fa !important; }
                .leaflet-control-attribution { 
                    background-color: rgba(0, 0, 0, 0.5) !important; 
                    color: rgba(255, 255, 255, 0.4) !important; 
                    font-size: 8px !important;
                }
                .leaflet-control-attribution a { color: rgba(255, 255, 255, 0.6) !important; }
              `}
                    </style>

                    <MapContainer
                        center={[activeMarkers[0].lat, activeMarkers[0].lon]}
                        zoom={13}
                        scrollWheelZoom={false}
                        dragging={false}
                        touchZoom={false}
                        doubleClickZoom={false}
                        zoomControl={false}
                        attributionControl={false}
                        className="w-full h-full relative z-0 pointer-events-none"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            subdomains={['a', 'b', 'c', 'd']}
                            maxZoom={19}
                        />

                        {activeMarkers.map((marker) => (
                            <Marker
                                key={marker.id}
                                position={[marker.lat, marker.lon]}
                                icon={createCustomIcon(marker.name, marker.state)}
                            />
                        ))}

                        <MapBoundsUpdater markers={activeMarkers} />
                    </MapContainer>
                </div>
            )}

            {/* Absolute overlay over the map to show top-nav info visually cleanly */}
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none z-[400] flex justify-between px-5 py-4">
                <div className="flex flex-col drop-shadow-md">
                    <h3 className="text-white font-serif tracking-tight flex items-center gap-2">
                        <MapPin size={16} className={`${colors.text}`} /> Live Locations
                    </h3>
                    <span className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">Tracker Uplink</span>
                </div>
                <div className="flex gap-1 flex-col items-end">
                    {activeMarkers.map(m => (
                        <div key={m.id} className="flex items-center gap-2 bg-slate-900/60 backdrop-blur backdrop-brightness-75 px-2 py-0.5 rounded border border-slate-700/50 shadow-sm pointer-events-auto">
                            <span className={`w-1.5 h-1.5 rounded-full ${m.state.toLowerCase() === 'home' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
                            <span className="text-[9px] text-slate-300 font-kumbh tracking-wider">{m.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default LiveLocationCard;
