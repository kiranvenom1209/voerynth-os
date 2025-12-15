import React, { useRef, useEffect } from 'react';
import { Fan, Thermometer, Power, MoveHorizontal } from 'lucide-react';
import Card from './Card';
import { useHomeAssistant, useHassEntity } from '../context/HomeAssistantContext';

const FanCard = ({ delay = 0, disableAnimation, editMode = false, onEditClick = null, cardId = null }) => {
    const { callService } = useHomeAssistant();
    const fan = useHassEntity('fan.air_circulator', { state: 'off', attributes: { percentage: 0 } });
    const temp = useHassEntity('sensor.air_circulator_temperature', { state: '22' });
    const oscillate = useHassEntity('switch.air_circulator_horizontally_oscillating', { state: 'off' });

    const isOn = fan.state === 'on';
    const targetSpeed = isOn ? (fan.attributes.percentage || 0) : 0;
    const isOscillating = oscillate.state === 'on';

    // Fixed Precision to 1 decimal
    const tempValue = parseFloat(temp.state);
    const displayTemp = !isNaN(tempValue) ? tempValue.toFixed(1) : temp.state;

    // Physics state for smooth spin-up/down with proportional speed
    const rotationRef = useRef(0);
    const currentSpeedRef = useRef(0); // Current actual speed (smoothly interpolated)
    const frameRef = useRef(null);
    const fanIconRef = useRef(null);

    useEffect(() => {
        const animate = () => {
            // Physics constants for smooth acceleration/deceleration
            const accelerationRate = 0.8; // How quickly to reach target speed
            const decelerationRate = 0.6; // How quickly to slow down
            const minSpeed = 0.05; // Minimum speed threshold to stop animation

            // Calculate target velocity based on percentage (0-100)
            // Scale: 0% = 0 deg/frame, 100% = 15 deg/frame (full speed)
            const targetVelocity = (targetSpeed / 100) * 15;

            // Smoothly interpolate current speed towards target
            const speedDifference = targetVelocity - currentSpeedRef.current;

            if (Math.abs(speedDifference) > 0.01) {
                // Accelerating or decelerating
                if (speedDifference > 0) {
                    // Speed up gradually
                    currentSpeedRef.current += speedDifference * accelerationRate * 0.1;
                } else {
                    // Slow down gradually
                    currentSpeedRef.current += speedDifference * decelerationRate * 0.1;
                }
            } else {
                // Close enough to target, snap to it
                currentSpeedRef.current = targetVelocity;
            }

            // Ensure we don't go below zero or above max
            currentSpeedRef.current = Math.max(0, Math.min(currentSpeedRef.current, 15));

            // Apply rotation based on current speed
            rotationRef.current = (rotationRef.current + currentSpeedRef.current) % 360;

            if (fanIconRef.current) {
                fanIconRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
            }

            // Continue animation if there's any movement or if we haven't reached target yet
            if (currentSpeedRef.current > minSpeed || targetSpeed > 0) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                // Fully stopped
                currentSpeedRef.current = 0;
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [targetSpeed]);

    return (
        <Card
            className="md:col-span-2 bg-gradient-to-br from-slate-900/90 to-slate-900/50 relative overflow-visible border-slate-600/50"
            delay={delay}
            disableAnimation={disableAnimation}
            editMode={editMode}
            onEditClick={onEditClick}
            cardId={cardId}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-700
                 ${isOn ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                        <div ref={fanIconRef}>
                            <Fan size={32} />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-kumbh text-slate-100">Dreo Air Circulator</h4>
                        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Thermometer size={12} className="text-orange-400" />
                                {displayTemp}°C
                            </span>
                            <span className="w-px h-3 bg-slate-700"></span>
                            <span className={`tracking-wider ${isOn ? 'text-cyan-400' : 'text-slate-500'}`}>{isOn ? `${targetSpeed}% Power` : 'Offline'}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => callService('fan', 'toggle', { entity_id: 'fan.air_circulator' })}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95
                ${isOn ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'bg-slate-800 text-slate-500 border-slate-600'}`}
                >
                    <Power size={20} />
                </button>
            </div>

            <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                    <span className="text-[10px]  tracking-widest text-slate-500 w-12">Speed</span>
                    <div className="relative h-2 flex-1 bg-slate-800 rounded-full overflow-hidden group">
                        <input
                            type="range" min="0" max="100" step="1"
                            value={targetSpeed}
                            disabled={!isOn}
                            onChange={(e) => callService('fan', 'set_percentage', { entity_id: 'fan.air_circulator', percentage: parseInt(e.target.value) })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${targetSpeed}%` }}></div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => callService('switch', 'toggle', { entity_id: 'switch.air_circulator_horizontally_oscillating' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs  tracking-wider transition-all
                   ${isOscillating ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                    >
                        <MoveHorizontal size={14} className={isOscillating ? 'animate-pulse' : ''} />
                        Oscillation
                    </button>
                </div>
            </div>

            {/* Wind Particles Effect */}
            {isOn && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute top-1/2 left-10 w-20 h-px bg-cyan-400 animate-[slideRight_1s_linear_infinite]"></div>
                    <div className="absolute top-1/3 left-20 w-12 h-px bg-cyan-400 animate-[slideRight_1.5s_linear_infinite] delay-100"></div>
                    <div className="absolute bottom-1/3 left-5 w-32 h-px bg-cyan-400 animate-[slideRight_0.8s_linear_infinite] delay-300"></div>
                </div>
            )}
        </Card>
    );
};

export default FanCard;
