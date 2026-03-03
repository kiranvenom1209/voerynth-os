import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import CompanyLogo from './CompanyLogo';
import { useAccentColor } from '../context/AccentColorContext';

const ScreenSaver = ({ brightness = 5, onStartDismiss, onDismiss }) => {
	    const { colors } = useAccentColor();
	    const [time, setTime] = useState(() => new Date());
	    const [reveal, setReveal] = useState(null);
	    const [circleSize, setCircleSize] = useState(0);
	    const animationRef = useRef(null);

	    // Local clock for screen saver time display
	    useEffect(() => {
	        const id = setInterval(() => setTime(new Date()), 1000);
	        return () => clearInterval(id);
	    }, []);

    // Calculate opacity based on brightness (5% = very dim, 40% = more visible)
    const contentOpacity = Math.min(0.3 + (brightness / 100), 0.7);
    const overlayOpacity = 1 - (brightness / 100);

    // Dynamic glow based on brightness
    const glowStyle = useMemo(() => {
        const glowOpacity = 0.05 + (brightness / 200);
        return `drop-shadow(0 0 40px rgba(${colors.rgb}, ${glowOpacity}))`;
    }, [brightness, colors.rgb]);

    // Animate the circle expansion using requestAnimationFrame
    useEffect(() => {
        if (!reveal) return;

        const duration = 750; // Slower for a more elegant, appreciable reveal
        const startTime = performance.now();
        const targetSize = reveal.maxRadius * 2 + 100;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart for smooth, regal deceleration
            const eased = 1 - Math.pow(1 - progress, 4);
            setCircleSize(eased * targetSize);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [reveal]);

    // Handle tap with circle reveal effect
    const handleTap = useCallback((e) => {
        if (reveal) return;

        // Notify parent that dismiss animation is starting
        onStartDismiss?.();

        const x = e.clientX ?? (e.touches?.[0]?.clientX) ?? window.innerWidth / 2;
        const y = e.clientY ?? (e.touches?.[0]?.clientY) ?? window.innerHeight / 2;

        // Calculate max radius to cover entire screen from tap point
        const maxX = Math.max(x, window.innerWidth - x);
        const maxY = Math.max(y, window.innerHeight - y);
        const maxRadius = Math.ceil(Math.sqrt(maxX * maxX + maxY * maxY));

        setReveal({ x, y, maxRadius });

        setTimeout(() => {
            onDismiss();
        }, 800); // Slightly after animation completes (750ms)
    }, [reveal, onStartDismiss, onDismiss]);

    return (
        <div
            className="fixed inset-0 z-[9999] cursor-pointer overflow-hidden"
            onClick={handleTap}
        >
            {/*
                The "hole puncher" - a transparent circle with a massive box-shadow.
                The box-shadow IS the black screen. As the circle grows, the hole grows.
            */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    left: reveal ? `${reveal.x}px` : '50%',
                    top: reveal ? `${reveal.y}px` : '50%',
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 200vmax rgba(0, 0, 0, 1)',
                }}
            />

            {/* Brightness overlay - on top of the box-shadow */}
            <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{
                    opacity: reveal ? 0 : overlayOpacity,
                    transition: 'opacity 0.3s ease-out'
                }}
            />

            {/* Content container - fades out when revealing */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{
                    opacity: reveal ? 0 : 1,
                    transition: 'opacity 0.25s ease-out'
                }}
            >
                {/* Subtle animated background */}
                <div className="absolute inset-0 overflow-hidden" style={{ opacity: contentOpacity * 0.5 }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-slate-900/30 via-transparent to-transparent animate-[pulse_8s_ease-in-out_infinite]" />
                </div>

                {/* Logo with elegant float animation */}
                <div
                    className="mb-8 animate-[float_4s_ease-in-out_infinite] relative z-10"
                    style={{ opacity: contentOpacity, filter: glowStyle }}
                >
                    <CompanyLogo className={`w-32 h-32 ${colors.text}`} />
                </div>

                {/* Time display */}
                <div className="text-center relative z-10" style={{ opacity: contentOpacity }}>
                    <div className="text-7xl sm:text-8xl font-kumbh text-slate-300 font-light tracking-tight mb-2">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`text-lg sm:text-xl ${colors.text} tracking-[0.3em] uppercase font-light`} style={{ opacity: 0.7 }}>
                        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Tap to dismiss hint */}
                <div
                    className="absolute bottom-12 left-0 right-0 text-center text-xs text-slate-600 tracking-widest uppercase animate-[pulse_3s_ease-in-out_infinite] z-10"
                    style={{ opacity: contentOpacity * 0.5 }}
                >
                    Tap anywhere to dismiss
                </div>
            </div>
        </div>
    );
};

export default ScreenSaver;
