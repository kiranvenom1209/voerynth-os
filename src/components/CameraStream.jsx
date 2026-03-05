import React, { useState, useEffect, useMemo } from 'react';
import { Video, Circle } from 'lucide-react';
import Card from './Card';
import { useHassEntity } from '../context/HomeAssistantContext';
import * as storage from '../utils/storage';

// --- CAMERA STREAM COMPONENT (Continuous MJPEG — like HA web interface) ---
//
// HA exposes two camera REST endpoints:
//   /api/camera_proxy/<entity_id>        → single JPEG snapshot
//   /api/camera_proxy_stream/<entity_id> → continuous MJPEG stream
//                                          (multipart/x-mixed-replace)
//
// The old code polled snapshots every 500ms → choppy, flickery.
// This version uses camera_proxy_stream — the browser natively renders the
// MJPEG stream in an <img> tag, exactly like HA's own camera card.
// No polling, no intervals, just one long-lived HTTP connection per camera.
//
const CameraStream = ({ entityId, name }) => {
	const [baseUrl, setBaseUrl] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [isMixedContentError, setIsMixedContentError] = useState(false);

	const entity = useHassEntity(entityId);
	const isUnavailable = entity?.isUnavailable;
	const accessToken = entity?.attributes?.access_token;

	// Load base URL on mount
	useEffect(() => {
		const loadConfig = async () => {
			const url = await storage.getItem('voerynth_ha_url');
			const normalizedUrl = (url || '').replace(/\/+$/, '');
			setBaseUrl(normalizedUrl);

			if (window.location.protocol === 'https:' && normalizedUrl.startsWith('http://')) {
				setIsMixedContentError(true);
			}
		};
		loadConfig();
	}, []);

	// Build the continuous MJPEG stream URL (derived state, no effect needed)
	// camera_proxy_stream (not camera_proxy) gives a real-time MJPEG stream.
	// The browser keeps the connection open and updates the <img> as each
	// JPEG frame arrives — smooth, real-time, no polling needed.
	const computedStreamUrl = useMemo(() => {
		if (!baseUrl || !accessToken || isUnavailable || isMixedContentError) return null;
		return `${baseUrl}/api/camera_proxy_stream/${entityId}?token=${accessToken}`;
	}, [baseUrl, entityId, accessToken, isUnavailable, isMixedContentError]);

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

			{isMixedContentError ? (
				<div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 px-4 text-center min-h-[300px]">
					<Video size={48} className="text-red-500/80 mb-3 mt-4" />
					<span className="text-red-400 font-bold text-sm mb-2">Stream Blocked by Browser</span>
					<p className="text-slate-400 text-xs max-w-[240px] leading-relaxed mb-4">
						Your browser prevents loading insecure HTTP camera streams on this secure HTTPS site (Mixed Content Warning).
						<br /><br />
						Access Home Assistant via HTTPS (e.g., Nabu Casa).
					</p>
				</div>
			) : computedStreamUrl ? (
				<>
					{/* Loading state shown underneath until first frame arrives */}
					{isLoading && (
						<div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-600 flex-col gap-2 z-10">
							<Video size={48} />
							<span className="text-xs tracking-widest">Connecting stream...</span>
						</div>
					)}
					<img
						src={computedStreamUrl}
						alt={name}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[300px]"
						onLoad={() => setIsLoading(false)}
						onError={() => {
							setHasError(true);
							setIsLoading(false);
						}}
					/>
					{hasError && (
						<div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-slate-500 flex-col gap-2 z-10">
							<Video size={48} />
							<span className="text-xs tracking-widest">Stream unavailable</span>
						</div>
					)}
				</>
			) : (
				<div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 flex-col gap-2 min-h-[300px]">
					<Video size={48} />
					<span className="text-xs tracking-widest">
						{isUnavailable ? 'Camera offline' : 'Connecting...'}
					</span>
				</div>
			)}
		</Card>
	);
};

export default CameraStream;
