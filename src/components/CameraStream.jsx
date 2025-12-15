import React, { useState, useEffect, useRef } from 'react';
import { Video, Circle } from 'lucide-react';
import Card from './Card';
import { useHassEntity } from '../context/HomeAssistantContext';
import * as storage from '../utils/storage';

// --- CAMERA STREAM COMPONENT (Fast Refresh Mode) ---
// Using a high-frequency snapshot refresh bypasses browser connection limits for MJPEG streams
const CameraStream = ({ entityId, name }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [baseUrl, setBaseUrl] = useState('');
    const intervalRef = useRef(null);
    const imgRef = useRef(null);

    const entity = useHassEntity(entityId);
    const token = entity?.attributes?.access_token;

    // Load base URL on mount
    useEffect(() => {
        const loadBaseUrl = async () => {
            const url = await storage.getItem('voerynth_ha_url');
            setBaseUrl(url || '');
        };
        loadBaseUrl();
    }, []);

    useEffect(() => {
        if (!token || !baseUrl) return;

        const updateFrame = () => {
            // Add timestamp to force browser to fetch new image
            const url = `${baseUrl}/api/camera_proxy/${entityId}?token=${token}&time=${Date.now()}`;

            // Preload image to avoid flicker
            const img = new Image();
            img.onload = () => {
                setImageUrl(url);
            };
            img.src = url;
        };

        // Initial load
        updateFrame();

        // Refresh every 66ms (15 FPS) for smoother video
        intervalRef.current = setInterval(updateFrame, 66);

        return () => clearInterval(intervalRef.current);
    }, [entityId, token, baseUrl]);

    return (
        <Card className="p-0 min-h-[300px] group relative overflow-hidden" noPadding>
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 items-center">
                <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse shadow-lg">
                    <Circle size={6} fill="currentColor" /> LIVE
                </div>
                <div className="bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur shadow-lg">
                    {name}
                </div>
            </div>

            {imageUrl ? (
                <img
                    ref={imgRef}
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[300px]"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 flex-col gap-2 min-h-[300px]">
                    <Video size={48} />
                    <span className="text-xs tracking-widest">Connecting...</span>
                </div>
            )}
        </Card>
    );
};

export default CameraStream;
