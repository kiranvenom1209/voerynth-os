import React, { useState, useEffect, useRef } from 'react';
import { Video, Circle } from 'lucide-react';
import Card from './Card';
import { useHassEntity } from '../context/HomeAssistantContext';
import * as storage from '../utils/storage';

// --- CAMERA STREAM COMPONENT (Snapshot-based - CORS Bypass) ---
// Uses the entity_picture attribute which contains an auth token,
// allowing us to load it directly via <img> tag and bypass CORS restrictions.
const CameraStream = ({ entityId, name }) => {
	const [baseUrl, setBaseUrl] = useState('');
	const [timestamp, setTimestamp] = useState(Date.now());
	const [isMixedContentError, setIsMixedContentError] = useState(false);
	const intervalRef = useRef(null);

	const entity = useHassEntity(entityId);
	const isUnavailable = entity?.isUnavailable;

	// entity_picture typically looks like: /api/camera_proxy/camera.name?token=abcdef123...
	const entityPicture = entity?.attributes?.entity_picture;

	// Load base URL on mount
	useEffect(() => {
		const loadConfig = async () => {
			const url = await storage.getItem('voerynth_ha_url');
			// Normalize: strip trailing slash so we don't end up with //api/...
			const normalizedUrl = (url || '').replace(/\/+$/, '');
			setBaseUrl(normalizedUrl);

			// Fast-fail check for HTTP mixed-content on HTTPS Netlify
			if (window.location.protocol === 'https:' && normalizedUrl.startsWith('http://')) {
				setIsMixedContentError(true);
			}
		};
		loadConfig();
	}, []);

	// Periodically update the timestamp to fetch a new frame
	useEffect(() => {
		if (!baseUrl || isUnavailable || !entityPicture || isMixedContentError) return;

		// Refresh roughly twice per second to balance fluidity and bandwidth
		intervalRef.current = setInterval(() => {
			setTimestamp(Date.now());
		}, 500);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [baseUrl, isUnavailable, entityPicture, isMixedContentError]);

	// Construct the stream URL. Add the timestamp to bust the browser's image cache.
	// Ensure we handle cases where the entityPicture already has query params vs when it doesn't.
	const separator = entityPicture && entityPicture.includes('?') ? '&' : '?';
	const streamUrl = entityPicture && baseUrl && !isMixedContentError
		? `${baseUrl}${entityPicture}${separator}_t=${timestamp}`
		: null;

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
			) : streamUrl ? (
				<img
					src={streamUrl}
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
