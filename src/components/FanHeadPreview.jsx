import React, { useEffect, useRef } from 'react';

const clampAngle = (value, min, max) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(min, Math.min(max, numericValue));
};

const FanHeadPreview = ({ horizontalAngle = 0, verticalAngle = 0, speed = 0, isOn = false }) => {
    const headRef = useRef(null);
    const bladeRef = useRef(null);
    const targetRef = useRef({
        horizontalAngle: clampAngle(horizontalAngle, -60, 60),
        verticalAngle: clampAngle(verticalAngle, -30, 90),
        speed,
        isOn,
    });
    const displayRef = useRef({
        horizontalAngle: clampAngle(horizontalAngle, -60, 60),
        verticalAngle: clampAngle(verticalAngle, -30, 90),
        bladeAngle: 0,
        bladeVelocity: 0,
    });
    const frameRef = useRef(null);

    useEffect(() => {
        targetRef.current = {
            horizontalAngle: clampAngle(horizontalAngle, -60, 60),
            verticalAngle: clampAngle(verticalAngle, -30, 90),
            speed,
            isOn,
        };
    }, [horizontalAngle, verticalAngle, speed, isOn]);

    useEffect(() => {
        const animate = () => {
            const target = targetRef.current;
            const display = displayRef.current;
            display.horizontalAngle += (target.horizontalAngle - display.horizontalAngle) * 0.12;
            display.verticalAngle += (target.verticalAngle - display.verticalAngle) * 0.12;

            const targetBladeVelocity = target.isOn ? 3 + (target.speed * 0.08) : 0;
            display.bladeVelocity += (targetBladeVelocity - display.bladeVelocity) * 0.08;
            display.bladeAngle = (display.bladeAngle + display.bladeVelocity) % 360;

            if (headRef.current) {
                const yaw = display.horizontalAngle * 0.72;
                const pitch = display.verticalAngle * 0.58;
                const sideShade = Math.abs(display.horizontalAngle) / 60;
                headRef.current.style.transform = `translate3d(-50%, -50%, 34px) rotateY(${yaw}deg) rotateX(${pitch}deg)`;
                headRef.current.style.setProperty('--sideShade', sideShade.toFixed(3));
            }

            if (bladeRef.current) {
                bladeRef.current.style.transform = `rotate(${display.bladeAngle}deg)`;
                bladeRef.current.style.opacity = target.isOn ? '0.8' : '0.58';
            }

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    return (
        <div
            data-testid="fan-depth-preview"
            aria-label="Dreo fan angle preview"
            className="relative h-full min-h-44 w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_34%,rgba(148,163,184,0.12),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.94))]"
        >
            <div className="absolute inset-x-8 bottom-7 h-5 rounded-full bg-slate-950/80 blur-md" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute inset-0 [perspective:760px]">
                <div className="absolute left-1/2 top-[58%] h-24 w-28 -translate-x-1/2 rounded-t-[48%] border border-slate-700/50 bg-[linear-gradient(180deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_38px_rgba(2,6,23,0.45)]" />
                <div className="absolute left-1/2 top-[49%] h-24 w-44 -translate-x-1/2 [transform-style:preserve-3d]">
                    <div className="absolute left-2 top-14 h-20 w-2 rounded-full bg-[linear-gradient(180deg,#334155,#0f172a)] shadow-[inset_1px_0_0_rgba(255,255,255,0.06)]" />
                    <div className="absolute right-2 top-14 h-20 w-2 rounded-full bg-[linear-gradient(180deg,#334155,#0f172a)] shadow-[inset_1px_0_0_rgba(255,255,255,0.06)]" />
                    <div className="absolute left-3 top-12 h-2 w-14 rounded-full bg-slate-700/70" />
                    <div className="absolute right-3 top-12 h-2 w-14 rounded-full bg-slate-700/70" />
                </div>

                <div
                    ref={headRef}
                    data-testid="fan-preview-head"
                    className="absolute left-1/2 top-[42%] h-32 w-36 rounded-[42%] border border-slate-500/25 bg-[linear-gradient(145deg,rgba(51,65,85,0.98),rgba(15,23,42,0.96)_48%,rgba(2,6,23,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.11),inset_-16px_-10px_34px_rgba(2,6,23,0.52),0_22px_50px_rgba(2,6,23,0.48)] [transform-style:preserve-3d] will-change-transform"
                >
                    <div className="absolute -inset-1 rounded-[42%] border border-slate-900/90 bg-[linear-gradient(135deg,rgba(148,163,184,0.14),rgba(15,23,42,0.1))] [transform:translateZ(-12px)]" />
                    <div className="absolute inset-3 rounded-full border border-slate-400/20 bg-[radial-gradient(circle_at_43%_35%,rgba(148,163,184,0.2),transparent_24%),radial-gradient(circle,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_68%)] shadow-[inset_0_0_28px_rgba(2,6,23,0.75),inset_0_0_0_1px_rgba(255,255,255,0.03)] [transform:translateZ(10px)]">
                        <div
                            ref={bladeRef}
                            data-testid="fan-preview-blades"
                            className="absolute inset-[26%] rounded-full will-change-transform"
                        >
                            {[0, 90, 180, 270].map((angle) => (
                                <span
                                    key={angle}
                                    className="absolute left-1/2 top-1/2 h-[48%] w-[22%] origin-bottom rounded-full bg-[linear-gradient(180deg,rgba(148,163,184,0.54),rgba(30,41,59,0.1))] blur-[0.2px]"
                                    style={{
                                        transform: `translate(-50%, -100%) rotate(${angle}deg) skewX(-10deg)`,
                                    }}
                                />
                            ))}
                        </div>

                        {[10, 22, 34].map((inset) => (
                            <div
                                key={inset}
                                className="absolute rounded-full border border-slate-300/12"
                                style={{ inset }}
                            />
                        ))}

                        {Array.from({ length: 14 }, (_, index) => (
                            <span
                                key={index}
                                className="absolute left-1/2 top-[8%] h-[84%] w-px origin-center bg-gradient-to-b from-transparent via-slate-300/18 to-transparent"
                                style={{ transform: `translateX(-50%) rotate(${index * (180 / 14)}deg)` }}
                            />
                        ))}

                        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/20 bg-[radial-gradient(circle_at_36%_30%,rgba(226,232,240,0.28),rgba(51,65,85,0.7)_34%,rgba(15,23,42,0.98)_72%)] shadow-[0_0_18px_rgba(2,6,23,0.72)]" />
                        <div className="absolute bottom-3 right-5 h-1.5 w-1.5 rounded-full bg-amber-300/70 shadow-[0_0_10px_rgba(251,191,36,0.26)]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FanHeadPreview;
