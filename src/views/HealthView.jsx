import React, { useMemo } from 'react';
import { Heart, Droplets, Activity, ArrowUp, ArrowDown, Footprints, Flame, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import { useHassEntity } from '../context/HomeAssistantContext';

// --- Background SVG trace components ---
const EcgTrace = ({ color = 'red', opacity = 0.07 }) => (
	<svg className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" preserveAspectRatio="none" viewBox="0 0 400 80">
		<path
			d="M0,40 L60,40 L70,40 L80,20 L90,60 L100,10 L110,70 L120,40 L130,40 L200,40 L210,40 L220,20 L230,60 L240,10 L250,70 L260,40 L270,40 L400,40"
			fill="none"
			stroke={color}
			strokeWidth="1.5"
			opacity={opacity}
			className="health-ecg-line"
		/>
	</svg>
);

const WaveTrace = ({ color = '#3b82f6', opacity = 0.06 }) => (
	<svg className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" preserveAspectRatio="none" viewBox="0 0 400 80">
		<path
			d="M0,50 Q50,30 100,50 Q150,70 200,50 Q250,30 300,50 Q350,70 400,50"
			fill="none"
			stroke={color}
			strokeWidth="1.5"
			opacity={opacity}
			className="health-wave-line"
		/>
	</svg>
);

const PulseTrace = ({ color = '#f59e0b', opacity = 0.06 }) => (
	<svg className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" preserveAspectRatio="none" viewBox="0 0 400 80">
		<path
			d="M0,45 L80,45 L95,45 L105,25 L115,55 L125,45 L200,45 L280,45 L295,45 L305,25 L315,55 L325,45 L400,45"
			fill="none"
			stroke={color}
			strokeWidth="1.2"
			opacity={opacity}
			className="health-pulse-line"
		/>
	</svg>
);

// --- Health Greeting Generator (converted from HA Jinja2 template) ---
const getHealthGreeting = (hr, rhr, spo2, sys, dia, steps) => {
	const hour = new Date().getHours();
	const name = 'Kiran';

	const greetings = {
		morning: [
			`Good morning, ${name}. Your body booted before your brain did.`,
			`Morning, ${name}. Let's check the logs before we sprint into the day.`,
			`Good morning, ${name}. Quiet strength first, everything else later.`,
		],
		afternoon: [
			`Good afternoon, ${name}. Midday check: we still running clean?`,
			`Afternoon, ${name}. If the mind is loud, the body deserves a calm audit.`,
			`Good afternoon, ${name}. Small adjustments now prevent big failures later.`,
		],
		evening: [
			`Good evening, ${name}. Time to downshift — gently, like a classic gearbox.`,
			`Evening, ${name}. Let the day end without dragging your pulse along with it.`,
			`Good evening, ${name}. Tonight's mission: recovery.`,
		],
		night: [
			`Late hours, ${name}. Even machines cool down; legends do too.`,
			`Night mode, ${name}. Let the nervous system exhale.`,
			`Still awake, ${name}? Fine. But no heroics — just clean, quiet recovery.`,
		],
	};

	let pool;
	if (hour >= 5 && hour < 12) pool = greetings.morning;
	else if (hour >= 12 && hour < 18) pool = greetings.afternoon;
	else if (hour >= 18 && hour < 22) pool = greetings.evening;
	else pool = greetings.night;

	const greeting = pool[Math.floor(Math.random() * pool.length)];

	// Build health status line
	const hasAny = hr > 0 || spo2 > 0 || sys > 0 || dia > 0;
	let status = '';
	if (!hasAny) {
		status = 'No fresh readings yet. Open your health app or take a quick measurement.';
	} else {
		const parts = [];
		if (spo2 > 0 && spo2 < 93) parts.push(`Oxygen looks low (SpO₂ ${spo2}%). Try a calm re-check.`);
		if (hr >= 100) parts.push(`Heart rate is elevated (${hr} bpm). Take a breath.`);
		if (hr > 0 && hr < 55) parts.push(`Heart rate is low (${hr} bpm). Monitor if you feel dizzy.`);
		if (sys >= 140 || dia >= 90) parts.push(`Blood pressure is high (${sys}/${dia}). Consider resting.`);
		if (parts.length === 0) {
			if (steps > 8000) parts.push(`${steps.toLocaleString()} steps — strong day on the move.`);
			else parts.push('Vitals look stable. Keep the rhythm going.');
		}
		status = parts.join(' ');
	}

	return { greeting, status };
};

// --- Helper: color classes based on value thresholds ---
const getHRColor = (hr) => {
	if (hr === 0) return 'text-slate-500';
	if (hr < 60) return 'text-emerald-400';
	if (hr < 100) return 'text-amber-400';
	return 'text-red-400';
};

const getSpO2Color = (spo2) => {
	if (spo2 === 0) return 'text-slate-500';
	if (spo2 >= 96) return 'text-emerald-400';
	if (spo2 >= 93) return 'text-amber-400';
	return 'text-red-400';
};

const getBPColor = (sys, dia) => {
	if (sys === 0 || dia === 0) return 'text-slate-500';
	if (sys < 120 && dia < 80) return 'text-emerald-400';
	if (sys < 140 || dia < 90) return 'text-amber-400';
	return 'text-red-400';
};

// --- Small badge component for the top row ---
const VitalBadge = ({ icon: Icon, label, value, color }) => {
	const colorMap = {
		red: 'bg-red-500/15 text-red-400 border-red-500/30',
		amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
		blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
		green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
	};
	return (
		<div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
			<Icon size={14} />
			<span className="text-xs font-medium">{label}</span>
			<span className="text-xs font-mono opacity-80">{value}</span>
		</div>
	);
};

// --- Section heading ---
const SectionHeading = ({ icon: Icon, title }) => (
	<div className="flex items-center gap-3 px-2 pt-2">
		<Icon size={20} className="text-slate-400" />
		<h3 className="text-lg font-serif text-slate-300 tracking-wide">{title}</h3>
	</div>
);

const HealthView = ({ editMode = false, onCardEdit = null }) => {
	// Pull all health entities
	const heartRate = useHassEntity('sensor.sm_s918b_heart_rate', { state: '0' });
	const restingHR = useHassEntity('sensor.sm_s918b_resting_heart_rate', { state: '0' });
	const spo2 = useHassEntity('sensor.sm_s918b_oxygen_saturation', { state: '0' });
	const systolic = useHassEntity('sensor.sm_s918b_systolic_blood_pressure', { state: '0' });
	const diastolic = useHassEntity('sensor.sm_s918b_diastolic_blood_pressure', { state: '0' });
	const dailySteps = useHassEntity('sensor.sm_s918b_daily_steps', { state: '0' });
	const watchSteps = useHassEntity('sensor.galaxy_watch6_classic_1w4a_steps_sensor', { state: '0' });
	const calories = useHassEntity('sensor.sm_s918b_total_calories_burned', { state: '0' });
	const floors = useHassEntity('sensor.sm_s918b_daily_floors', { state: '0' });

	// Parse values
	const hrVal = parseInt(heartRate.state) || 0;
	const rhrVal = parseInt(restingHR.state) || 0;
	const spo2Val = parseFloat(spo2.state) || 0;
	const sysVal = parseInt(systolic.state) || 0;
	const diaVal = parseInt(diastolic.state) || 0;
	const stepsVal = parseInt(dailySteps.state) || 0;
	const watchStepsVal = parseInt(watchSteps.state) || 0;
	const calVal = parseInt(calories.state) || 0;
	const floorsVal = parseInt(floors.state) || 0;

	// Greeting (memoized to avoid re-randomizing on every render)
	const { greeting, status } = useMemo(
		() => getHealthGreeting(hrVal, rhrVal, spo2Val, sysVal, diaVal, stepsVal),
		// Only re-generate when values change meaningfully
		[hrVal > 0, spo2Val > 0, sysVal > 0, stepsVal > 8000]
	);

	return (
		<div className="space-y-6 animate-[fadeIn_0.8s_ease-out]">
			{/* Health Greeting Header */}
			<div className="px-2">
				<h2 className="text-2xl font-serif text-slate-200">{greeting}</h2>
				<p className="text-sm text-slate-400 mt-2">{status}</p>
			</div>

			{/* Top Badges Row */}
			<div className="flex flex-wrap gap-3 px-2">
				<VitalBadge icon={Heart} label="HR Live" value={hrVal > 0 ? `${hrVal} bpm` : '—'} color="red" />
				<VitalBadge icon={Heart} label="Resting" value={rhrVal > 0 ? `${rhrVal} bpm` : '—'} color="amber" />
				<VitalBadge icon={Droplets} label="SpO₂" value={spo2Val > 0 ? `${spo2Val}%` : '—'} color="blue" />
			</div>

			{/* Core Vitals */}
			<SectionHeading icon={Activity} title="Core Vitals" />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				<Card title="Live Heart Rate" subtitle="Real-time BPM" editMode={editMode} onEditClick={onCardEdit} cardId="health-hr">
					<div className="relative overflow-hidden rounded-lg">
						{hrVal > 0 && <EcgTrace color="#ef4444" opacity={0.08} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className={`text-5xl font-thin font-kumbh ${getHRColor(hrVal)}`}>
								{hrVal > 0 ? hrVal : '—'}
							</span>
							<Heart size={28} className={`mb-2 ${hrVal > 0 ? 'text-red-500' : 'text-slate-600'}`} />
						</div>
						<span className="relative z-10 text-xs text-slate-500">bpm</span>
					</div>
				</Card>

				<Card title="Oxygen Saturation" subtitle="SpO₂ Level" editMode={editMode} onEditClick={onCardEdit} cardId="health-spo2">
					<div className="relative overflow-hidden rounded-lg">
						{spo2Val > 0 && <WaveTrace color="#3b82f6" opacity={0.08} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className={`text-5xl font-thin font-kumbh ${getSpO2Color(spo2Val)}`}>
								{spo2Val > 0 ? spo2Val : '—'}
							</span>
							<Droplets size={28} className={`mb-2 ${spo2Val > 0 ? 'text-blue-500' : 'text-slate-600'}`} />
						</div>
						<span className="relative z-10 text-xs text-slate-500">%</span>
					</div>
				</Card>

				<Card title="Resting Heart Rate" subtitle="Low Priority" editMode={editMode} onEditClick={onCardEdit} cardId="health-rhr">
					<div className="relative overflow-hidden rounded-lg">
						{rhrVal > 0 && <PulseTrace color="#f59e0b" opacity={0.07} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className="text-5xl font-thin font-kumbh text-amber-400">
								{rhrVal > 0 ? rhrVal : '—'}
							</span>
							<Heart size={28} className={`mb-2 ${rhrVal > 0 ? 'text-amber-500/60' : 'text-slate-600'}`} />
						</div>
						<span className="relative z-10 text-xs text-slate-500">bpm (resting)</span>
					</div>
				</Card>
			</div>

			{/* Blood Pressure */}
			<SectionHeading icon={TrendingUp} title="Blood Pressure" />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				<Card title="BP Readout" subtitle="Combined" editMode={editMode} onEditClick={onCardEdit} cardId="health-bp">
					<div className="relative overflow-hidden rounded-lg">
						{sysVal > 0 && <EcgTrace color="#a855f7" opacity={0.06} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className={`text-4xl font-thin font-kumbh ${getBPColor(sysVal, diaVal)}`}>
								{sysVal > 0 && diaVal > 0 ? `${sysVal}/${diaVal}` : '—/—'}
							</span>
							<Activity size={28} className={`mb-2 ${getBPColor(sysVal, diaVal)}`} />
						</div>
						<span className="relative z-10 text-xs text-slate-500">mmHg</span>
						{sysVal > 0 && diaVal > 0 && (
							<div className="relative z-10 mt-3 pt-3 border-t border-slate-800">
								<span className={`text-xs font-medium ${getBPColor(sysVal, diaVal)}`}>
									{sysVal < 120 && diaVal < 80 ? 'Normal' : sysVal < 140 || diaVal < 90 ? 'Elevated' : 'High'}
								</span>
							</div>
						)}
					</div>
				</Card>

				<Card title="Systolic" subtitle="Upper Reading" editMode={editMode} onEditClick={onCardEdit} cardId="health-sys">
					<div className="relative overflow-hidden rounded-lg">
						{sysVal > 0 && <PulseTrace color="#ef4444" opacity={0.06} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className="text-5xl font-thin font-kumbh text-red-400">
								{sysVal > 0 ? sysVal : '—'}
							</span>
							<ArrowUp size={28} className="text-red-500 mb-2" />
						</div>
						<span className="relative z-10 text-xs text-slate-500">mmHg</span>
					</div>
				</Card>

				<Card title="Diastolic" subtitle="Lower Reading" editMode={editMode} onEditClick={onCardEdit} cardId="health-dia">
					<div className="relative overflow-hidden rounded-lg">
						{diaVal > 0 && <PulseTrace color="#f97316" opacity={0.06} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className="text-5xl font-thin font-kumbh text-orange-400">
								{diaVal > 0 ? diaVal : '—'}
							</span>
							<ArrowDown size={28} className="text-orange-500 mb-2" />
						</div>
						<span className="relative z-10 text-xs text-slate-500">mmHg</span>
					</div>
				</Card>
			</div>

			{/* Daily Movement */}
			<SectionHeading icon={Footprints} title="Daily Movement" />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				<Card title="Steps" subtitle="Watch Sensor" editMode={editMode} onEditClick={onCardEdit} cardId="health-steps">
					<div className="relative overflow-hidden rounded-lg">
						{(watchStepsVal || stepsVal) > 0 && <WaveTrace color="#10b981" opacity={0.06} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className="text-5xl font-thin font-kumbh text-emerald-400">
								{watchStepsVal > 0 ? watchStepsVal.toLocaleString() : stepsVal > 0 ? stepsVal.toLocaleString() : '—'}
							</span>
							<Footprints size={28} className="text-emerald-500 mb-2" />
						</div>
						<div className="relative z-10 w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
							<div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(((watchStepsVal || stepsVal) / 10000) * 100, 100)}%` }} />
						</div>
						<span className="relative z-10 text-xs text-slate-500 mt-1">/ 10,000 goal</span>
					</div>
				</Card>

				<Card title="Calories" subtitle="Total Burned" editMode={editMode} onEditClick={onCardEdit} cardId="health-cal">
					<div className="relative overflow-hidden rounded-lg">
						{calVal > 0 && <WaveTrace color="#f97316" opacity={0.06} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className="text-5xl font-thin font-kumbh text-orange-400">
								{calVal > 0 ? calVal.toLocaleString() : '—'}
							</span>
							<Flame size={28} className="text-orange-500 mb-2" />
						</div>
						<span className="relative z-10 text-xs text-slate-500">kcal</span>
					</div>
				</Card>

				<Card title="Floors" subtitle="Climbed Today" editMode={editMode} onEditClick={onCardEdit} cardId="health-floors">
					<div className="relative overflow-hidden rounded-lg">
						{floorsVal > 0 && <WaveTrace color="#3b82f6" opacity={0.06} />}
						<div className="relative z-10 flex items-end justify-between mb-2">
							<span className="text-5xl font-thin font-kumbh text-blue-400">
								{floorsVal > 0 ? floorsVal : '—'}
							</span>
							<TrendingUp size={28} className="text-blue-500 mb-2" />
						</div>
						<span className="relative z-10 text-xs text-slate-500">floors</span>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default HealthView;

