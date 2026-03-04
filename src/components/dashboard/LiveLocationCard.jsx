import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useHassEntity } from '../../context/HomeAssistantContext';
import { useAccentColor } from '../../context/AccentColorContext';
import { MapPin, AlertCircle, Navigation } from 'lucide-react';
import Card from '../Card';
import { MapContainer, TileLayer, Marker, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useHomeAssistant } from '../../context/HomeAssistantContext';

// Fix for default Leaflet icon paths in some bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A helper component to automatically pan/zoom the map to fit all markers
const MapBoundsUpdater = ({ markers, isInteractive }) => {
    const map = useMap();

    useEffect(() => {
        // Only auto-update bounds if NOT in interactive mode
        if (markers.length > 0 && !isInteractive) {
            // Create a LatLngBounds object encompassing all marker coordinates
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lon]));
            // fitBounds adjusts zoom and center. padding prevents markers from touching the absolute edge of the card.
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17, animate: true, duration: 1.5 });
        }
    }, [markers, map, isInteractive]);

    return null;
};

// A helper component to dynamically enable/disable map interactions
const MapInteractionHandler = ({ isInteractive }) => {
    const map = useMap();

    useEffect(() => {
        if (isInteractive) {
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            if (map.tap) map.tap.enable();
        } else {
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            if (map.tap) map.tap.disable();
        }
    }, [map, isInteractive]);

    return null;
};

// Curated palette for zones that don't match a keyword
const ZONE_PALETTE = ['#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#a78bfa', '#f472b6', '#22d3ee', '#818cf8'];

// Helper to determine zone color based on name/purpose
// Only zone.home (your default HA home) gets emerald; friends' homes get unique colors
const getZoneColor = (name, zoneId) => {
    const n = name.toLowerCase();
    // Only YOUR home zone gets emerald
    if (n === 'home' && (!zoneId || zoneId === 'zone.home')) return '#10b981'; // Emerald
    if (n === 'work') return '#f59e0b'; // Amber
    if (n === 'school' || n === 'university' || n === 'college') return '#8b5cf6'; // Purple
    if (n.includes('gym') || n.includes('fitness') || n.includes('sport')) return '#ec4899'; // Pink
    if (n.includes('store') || n.includes('shop') || n.includes('mall')) return '#3b82f6'; // Blue
    if (n.includes('park') || n.includes('garden')) return '#22c55e'; // Green
    if (n.includes('hospital') || n.includes('doctor') || n.includes('clinic')) return '#ef4444'; // Red
    if (n.includes('church') || n.includes('mosque') || n.includes('temple')) return '#a78bfa'; // Violet
    if (n.includes('restaurant') || n.includes('cafe') || n.includes('food')) return '#fb923c'; // Orange
    if (n.includes('office')) return '#0ea5e9'; // Sky blue

    // Hash the name (+ zoneId for uniqueness) to pick a consistent color from the palette
    const hashStr = zoneId || n;
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
    return ZONE_PALETTE[Math.abs(hash) % ZONE_PALETTE.length];
};

const LiveLocationCard = ({ delay = 300, editMode = false, onEditClick = null, cardId = null }) => {
    const { colors } = useAccentColor();
    const { hassStates } = useHomeAssistant();
    const [isInteractive, setIsInteractive] = useState(false);
    const [routeData, setRouteData] = useState(null);
    const routeFetchRef = useRef(null);

    // Fetch the person entities
    const kiran = useHassEntity('person.kiran');
    const danny = useHassEntity('person.danny');
    const ayanthiara = useHassEntity('person.ayanthiara');


    // Parse and validate coordinates for zones
    const zones = useMemo(() => {
        return Object.keys(hassStates)
            .filter(key => key.startsWith('zone.'))
            .map(key => {
                const zone = hassStates[key];
                return {
                    id: key,
                    name: zone.attributes.friendly_name || key,
                    lat: zone.attributes.latitude,
                    lon: zone.attributes.longitude,
                    radius: zone.attributes.radius || 100
                };
            })
            .filter(z => z.lat && z.lon);
    }, [hassStates]);

    // Parse and validate coordinates. Only include people who have valid GPS data.
    const activeMarkers = useMemo(() => {
        const isKiranHome = kiran?.state?.toLowerCase() === 'home';

        const people = [
            { id: 'kiran', name: 'Kiran', data: kiran },
            { id: 'danny', name: 'Danny', data: danny },
            {
                id: 'ayanthiara',
                name: isKiranHome ? null : 'Home', // Treat ayanthiara as "Home" marker when Kiran is away
                data: ayanthiara
            }
        ];

        return people
            .filter(p => p.name && p.data?.attributes?.latitude && p.data?.attributes?.longitude)
            .map(p => ({
                id: p.id,
                name: p.name,
                state: p.data.state,
                lat: p.data.attributes.latitude,
                lon: p.data.attributes.longitude
            }));
    }, [kiran, danny, ayanthiara]);

    // Determine if Kiran is away from home
    const isKiranAway = kiran?.state && kiran.state.toLowerCase() !== 'home';
    const kiranLat = kiran?.attributes?.latitude;
    const kiranLon = kiran?.attributes?.longitude;
    const homeZone = zones.find(z => z.id === 'zone.home');

    // Fetch route from OSRM when Kiran is away from home
    useEffect(() => {
        // Clear route when home
        if (!isKiranAway || !kiranLat || !kiranLon || !homeZone) {
            setRouteData(null);
            return;
        }

        // Debounce to avoid excessive API calls
        if (routeFetchRef.current) clearTimeout(routeFetchRef.current);

        routeFetchRef.current = setTimeout(async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${kiranLon},${kiranLat};${homeZone.lon},${homeZone.lat}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    // OSRM returns [lon, lat] — flip to [lat, lon] for Leaflet
                    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
                    setRouteData({
                        coords,
                        distance: route.distance, // meters
                        duration: route.duration   // seconds
                    });
                }
            } catch (err) {
                console.warn('[Tactical] Route fetch failed:', err);
                setRouteData(null);
            }
        }, 2000); // 2s debounce

        return () => clearTimeout(routeFetchRef.current);
    }, [isKiranAway, kiranLat, kiranLon, homeZone]);

    // Format helpers for route HUD
    const formatDistance = (meters) => {
        if (!meters) return '--';
        if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
        return `${Math.round(meters)} m`;
    };
    const formatDuration = (seconds) => {
        if (!seconds) return '--';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins} min`;
    };


    // Check if a person's state matches a known zone
    const getPersonZoneColor = (state) => {
        const stateLower = state.toLowerCase();
        if (stateLower === 'not_home' || stateLower === 'unavailable' || stateLower === 'unknown') {
            return null; // Traveling / not in any zone
        }
        // Check if state matches any defined zone
        const matchedZone = zones.find(z => z.name.toLowerCase() === stateLower || z.id === `zone.${stateLower}`);
        if (matchedZone) {
            return getZoneColor(matchedZone.name, matchedZone.id);
        }
        // State is a zone name we know about (home, work, etc.) even if zone entity isn't loaded yet
        const knownZoneColor = getZoneColor(stateLower, `zone.${stateLower}`);
        if (knownZoneColor && stateLower !== 'not_home') {
            return knownZoneColor;
        }
        return null; // Unknown state = treat as traveling
    };

    // Create customized HTML markers — glow in zone color, red when traveling
    const createCustomIcon = (name, state) => {
        const zoneColor = getPersonZoneColor(state);
        const isTraveling = !zoneColor;
        const markerColor = isTraveling ? '#3b82f6' : zoneColor; // Blue when traveling

        const htmlString = `
      <div class="relative flex items-center justify-center pointer-events-none group">
        ${!isTraveling ? `<div class="absolute -inset-3 rounded-full blur-xl opacity-60 animate-pulse" style="background-color: ${markerColor}"></div>
        <div class="absolute -inset-1 rounded-full blur-sm opacity-40 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>` : ''}
        <div class="w-7 h-7 rounded-full border-2 bg-slate-950 shadow-2xl flex items-center justify-center z-10 overflow-hidden backdrop-blur-sm" style="border-color: ${markerColor}">
             <span class="text-[11px] font-black text-white uppercase tracking-tighter drop-shadow-md">${name.substring(0, 1)}</span>
        </div>
        <div class="absolute top-9 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-slate-700/50 whitespace-nowrap shadow-2xl skew-x-[-10deg] transition-all group-hover:skew-x-0">
           ${name}
        </div>
      </div>
    `;

        return L.divIcon({
            html: htmlString,
            className: 'custom-leaflet-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });
    };

    return (
        <Card
            delay={delay}
            className="p-0 min-h-[488px] lg:col-span-2 relative overflow-hidden group border-slate-800/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
            noPadding
            editMode={editMode}
            onEditClick={() => onEditClick?.(cardId)}
        >
            {activeMarkers.length === 0 ? (
                <div className="w-full h-full min-h-[488px] flex flex-col items-center justify-center bg-slate-950">
                    <AlertCircle size={32} className="text-slate-800 mb-3 animate-pulse" />
                    <p className="text-slate-600 font-kumbh text-xs tracking-widest uppercase">No GPS Telemetry Available</p>
                </div>
            ) : (
                <div className={`w-full h-full min-h-[488px] absolute inset-0 transition-all duration-700 ${isInteractive ? 'z-[60]' : 'z-0'}`}>
                    {/* Custom inject CSS to ensure leaflet tiles are dark/inverted further if needed */}
                    <style>
                        {`
                .leaflet-container { 
                    background-color: #020617 !important; 
                    font-family: inherit;
                }
                .leaflet-tile {
                    filter: ${isInteractive
                                ? 'brightness(1.5) contrast(1.2) saturate(0.8) sepia(100%) hue-rotate(190deg) brightness(0.8)'
                                : 'brightness(1.8) contrast(1.2) grayscale(20%)'
                            } !important;
                }
                .leaflet-container {
                    background-color: #020617 !important;
                }
                .leaflet-control-zoom { 
                    border: none !important; 
                    margin-right: 16px !important; 
                    margin-bottom: 24px !important; 
                    display: ${isInteractive ? 'block' : 'none'} !important;
                    z-index: 1000 !important;
                }
                .leaflet-control-zoom a { 
                    background-color: rgba(2, 6, 23, 0.8) !important; 
                    color: #94a3b8 !important; 
                    border: 1px solid rgba(51, 65, 85, 0.5) !important;
                    backdrop-filter: blur(8px);
                    border-radius: 4px !important;
                    margin-bottom: 4px;
                    pointer-events: auto !important;
                }
                .leaflet-control-zoom a:hover { background-color: #1e293b !important; color: #f8fafc !important; }
                .leaflet-control-attribution { 
                    background-color: transparent !important; 
                    color: rgba(71, 85, 105, 0.4) !important; 
                    font-size: 7px !important;
                    padding-right: 10px !important;
                }
                .leaflet-control-attribution a { color: rgba(71, 85, 105, 0.5) !important; }
              `}
                    </style>

                    <MapContainer
                        center={[activeMarkers[0].lat, activeMarkers[0].lon]}
                        zoom={13}
                        scrollWheelZoom={isInteractive}
                        dragging={isInteractive}
                        touchZoom={isInteractive}
                        doubleClickZoom={isInteractive}
                        zoomControl={true}
                        attributionControl={false}
                        className="w-full h-full relative z-0 pointer-events-auto"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            subdomains={['a', 'b', 'c', 'd']}
                            maxZoom={19}
                        />

                        {/* Render All Zones as styled circles */}
                        {zones.map(zone => {
                            const zoneColor = getZoneColor(zone.name, zone.id);
                            return (
                                <Circle
                                    key={zone.id}
                                    center={[zone.lat, zone.lon]}
                                    radius={zone.radius}
                                    pathOptions={{
                                        color: zoneColor,
                                        fillColor: zoneColor,
                                        fillOpacity: 0.05,
                                        weight: 1.5,
                                        dashArray: zone.name.toLowerCase() === 'home' ? '4, 8' : '8, 12',
                                        lineCap: 'round'
                                    }}
                                />
                            );
                        })}

                        {/* Route polyline to home (amber dashed) */}
                        {routeData && routeData.coords.length > 0 && (
                            <Polyline
                                positions={routeData.coords}
                                pathOptions={{
                                    color: '#f59e0b',
                                    weight: 1.5,
                                    opacity: 0.5,
                                    lineCap: 'round',
                                    lineJoin: 'round'
                                }}
                            />
                        )}

                        {activeMarkers.map((marker) => (
                            <Marker
                                key={marker.id}
                                position={[marker.lat, marker.lon]}
                                icon={createCustomIcon(marker.name, marker.state)}
                            />
                        ))}

                        <MapInteractionHandler isInteractive={isInteractive} />
                        <MapBoundsUpdater markers={activeMarkers} isInteractive={isInteractive} />
                    </MapContainer>

                    {/* INTERACTION SHIELD: This is the source of truth for map locking */}
                    {!isInteractive && (
                        <div className="absolute inset-0 z-[100] bg-transparent pointer-events-auto cursor-default"></div>
                    )}
                </div>
            )}



            {/* HUD Overlays - Framing only, never block interaction */}
            <div className={`transition-all duration-700 pointer-events-none z-40 ${isInteractive ? 'opacity-0' : 'opacity-100'}`}>
                {/* Tactical Blue Color Overlay using blend mode */}
                <div className="absolute inset-0 tactical-blue-overlay pointer-events-none"></div>

                {/* Technical Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                {/* Tactical mode vignette & scanlines */}
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(2,6,23,0.8)] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(59,130,246,0.01),rgba(16,185,129,0.005),rgba(59,130,246,0.01))] bg-[length:100%_4px,5px_100%] pointer-events-none"></div>
            </div>

            {/* Tactical Mode Toggle Button */}
            <div className="absolute bottom-6 right-6 z-[500] flex flex-col items-end gap-3">
                <button
                    onClick={() => setIsInteractive(!isInteractive)}
                    className={`group relative px-4 py-2 rounded-sm border transition-all duration-500 overflow-hidden backdrop-blur-md ${isInteractive
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:border-slate-500/50 shadow-xl'
                        }`}
                >
                    {/* Skewed background effect */}
                    <div className={`absolute inset-0 opacity-10 transition-transform duration-700 -skew-x-12 translate-x-16 group-hover:translate-x-0 ${isInteractive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>

                    <div className="relative flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] uppercase font-bold">
                        <div className={`w-1.5 h-1.5 rounded-full ${isInteractive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-slate-600'}`}></div>
                        {isInteractive ? 'Interaction Active' : 'Tactical Lock'}
                    </div>
                </button>

                {isInteractive && (
                    <div className="px-3 py-1 bg-slate-950/90 backdrop-blur-xl border border-slate-800/80 rounded-sm animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-2xl">
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.3em] font-medium opacity-80">Manual Override Engaged</p>
                    </div>
                )}
            </div>



            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none z-[400] flex justify-between px-4 sm:px-6 py-4 sm:py-5" style={{ height: routeData && isKiranAway ? '7.5rem' : '6rem' }}>
                <div className="flex flex-col drop-shadow-2xl">
                    <h3 className="text-white font-serif text-base sm:text-lg tracking-tight flex items-center gap-2">
                        <div className={`p-1 rounded-sm bg-slate-900 border border-slate-800 ${colors.text}`}>
                            <MapPin size={14} />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Tactical Overlay</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] text-slate-400 font-mono tracking-[0.2em] uppercase opacity-70">Telemetry Active // Global Link</span>
                    </div>

                    {/* Route-to-Home tactical HUD — compact */}
                    {routeData && isKiranAway && (
                        <div className="mt-2 flex items-center gap-2 w-fit bg-slate-950/70 backdrop-blur-xl px-2 py-1.5 rounded-sm border border-amber-500/30">
                            <Navigation size={9} className="text-amber-500 shrink-0" />
                            <span className="text-[9px] text-amber-400/90 font-mono font-bold">{formatDistance(routeData.distance)}</span>
                            <span className="text-[8px] text-slate-600">│</span>
                            <span className="text-[9px] text-amber-400/90 font-mono font-bold">{formatDuration(routeData.duration)}</span>
                        </div>
                    )}

                </div>
                <div className="flex gap-1.5 flex-col items-end">
                    {activeMarkers.map(m => {
                        const zc = getPersonZoneColor(m.state);
                        const isTraveling = !zc;
                        const dotColor = isTraveling ? '#3b82f6' : zc;
                        return (
                            <div key={m.id} className="flex items-center gap-2.5 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800/50 shadow-xl pointer-events-auto transition-all hover:border-slate-600/50 hover:bg-slate-900/80">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor, boxShadow: isTraveling ? 'none' : `0 0 10px ${dotColor}` }}></span>
                                <span className="text-[10px] text-slate-200 font-kumbh font-medium tracking-tight uppercase">${m.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};

export default LiveLocationCard;
