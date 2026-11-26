import React, { useEffect, useRef, useState } from 'react';
import {
  LAMP_DISTANCES_CM,
  calculateRelativeLightIntensity,
  simulatePhotosynthesisRate,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

interface Bubble {
  id: number;
  y: number;
  xOffset: number;
}

export const PhotosynthesisBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [distanceCm, setDistanceCm] = useState<number>(10);
  const [hasNaHCO3, setHasNaHCO3] = useState<boolean>(true);
  const [counting, setCounting] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [observedBubbles, setObservedBubbles] = useState<number>(0);
  const [manualTaps, setManualTaps] = useState<number>(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [trialSeed, setTrialSeed] = useState<number>(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const targetRatePerMin = simulatePhotosynthesisRate(distanceCm, hasNaHCO3, trialSeed);
  const relativeIntensity = calculateRelativeLightIntensity(distanceCm);
  const bubbleCounterRef = useRef(0);

  // Stop counting when distance or solution changes
  const handleSelectDistance = (d: number) => {
    setDistanceCm(d);
    setCounting(false);
    setElapsedSec(0);
    setObservedBubbles(0);
    setManualTaps(0);
    setBubbles([]);
    setTrialSeed((s) => s + 1);
    setFeedback(null);
    onCompleteStep(0);
  };

  // Run accelerated 10x virtual timer (6 real seconds = 60 virtual seconds) for responsive counting
  useEffect(() => {
    if (!counting) return;
    const intervalMs = 100;
    const virtualSecPerTick = 1.0; // 100ms real = 1.0s simulated -> full 60s trial in 6 seconds
    let bubbleAccumulator = 0;

    const timer = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = Math.min(60, prev + virtualSecPerTick);
        if (next >= 60) {
          setCounting(false);
          onCompleteStep(3);
        }
        return next;
      });

      // Spawn bubbles according to exact simulated rate per minute
      bubbleAccumulator += (targetRatePerMin / 60) * virtualSecPerTick;
      const toSpawn = Math.floor(bubbleAccumulator);
      if (toSpawn > 0) {
        bubbleAccumulator -= toSpawn;
        setObservedBubbles((c) => c + toSpawn);
        setBubbles((prev) => {
          const spawned: Bubble[] = Array.from({ length: toSpawn }).map(() => {
            bubbleCounterRef.current += 1;
            return {
              id: bubbleCounterRef.current,
              y: 162,
              xOffset: ((bubbleCounterRef.current * 7) % 13) - 6,
            };
          });
          return [...prev.map((b) => ({ ...b, y: b.y - 16 })).filter((b) => b.y > 54), ...spawned].slice(-28);
        });
      } else {
        setBubbles((prev) => prev.map((b) => ({ ...b, y: b.y - 16 })).filter((b) => b.y > 54));
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [counting, targetRatePerMin, onCompleteStep]);

  const handleStartTrial = () => {
    setElapsedSec(0);
    setObservedBubbles(0);
    setManualTaps(0);
    setBubbles([]);
    setCounting(true);
    setFeedback(null);
    onCompleteStep(1);
    onCompleteStep(2);
  };

  const handleCompleteInstant = () => {
    setCounting(false);
    setElapsedSec(60);
    setObservedBubbles(targetRatePerMin);
    onCompleteStep(2);
    onCompleteStep(3);
    setFeedback(`60 s trial complete: ${targetRatePerMin} O₂ bubbles released at ${distanceCm} cm.`);
  };

  const handleRecord = () => {
    if (elapsedSec < 60) {
      setFeedback('Complete the 60-second bubble count before recording your result.');
      return;
    }
    const recordedRate = observedBubbles > 0 ? observedBubbles : targetRatePerMin;
    onRecordRow({
      distanceCm,
      lightIntensity: relativeIntensity,
      bubblesPerMin: recordedRate,
      co2Supply: hasNaHCO3 ? '0.2% NaHCO₃ (Excess)' : 'Plain Water (Low CO₂)',
    });
    onCompleteStep(4);
    onCompleteStep(5);
    setFeedback(
      `Recorded ${distanceCm} cm (1/d² = ${relativeIntensity} a.u.): ${recordedRate} bubbles/min.`
    );
  };

  // Lamp horizontal position along SVG bench (10cm -> x=200, 50cm -> x=385)
  const lampX = 165 + distanceCm * 4.4;

  return (
    <div className="space-y-5">
      {/* Distance & CO2 Controls */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Set LED Lamp Distance Along Metre Ruler</h3>
            <p className="text-xs text-slate-500">
              LED lamp prevents heating the boiling tube; light intensity decreases proportionally to 1 ÷ d².
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={hasNaHCO3}
              onChange={(e) => {
                setHasNaHCO3(e.target.checked);
                setCounting(false);
                setElapsedSec(0);
                setObservedBubbles(0);
                onCompleteStep(1);
              }}
              className="rounded border-slate-300"
            />
            Add 0.2% NaHCO₃ (Excess CO₂)
          </label>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          {LAMP_DISTANCES_CM.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSelectDistance(d)}
              className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors ${
                distanceCm === d
                  ? 'border-teal-700 bg-teal-700 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {d} cm
            </button>
          ))}
        </div>
      </div>

      {/* Pondweed + Ruler + LED Lamp Stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-800">Elodea Pondweed Apparatus</span>
            <span className="font-mono text-slate-600">
              Stopwatch: {elapsedSec.toFixed(0)} / 60 s · Bubbles: {observedBubbles}
            </span>
          </div>

          <svg
            viewBox="0 0 460 250"
            className="h-auto w-full select-none"
            role="img"
            aria-label={`Elodea pondweed in boiling tube illuminated by LED lamp at ${distanceCm} centimetres`}
          >
            {/* Light cone from LED lamp toward pondweed */}
            <polygon
              points={`${lampX - 18},112 106,56 106,184`}
              fill="#FEF08A"
              fillOpacity={Math.max(0.14, Math.min(0.65, relativeIntensity / 120))}
            />

            {/* Boiling tube + clamp */}
            <path
              d="M 64 42 L 64 176 A 26 26 0 0 0 116 176 L 116 42 Z"
              fill="#FFFFFF"
              fillOpacity="0.7"
              stroke="#64748B"
              strokeWidth="2"
            />
            <path
              d="M 66 56 L 66 175 A 24 24 0 0 0 114 175 L 114 56 Z"
              fill="#E0F2FE"
              fillOpacity="0.65"
            />

            {/* Elodea pondweed stem and leaves (upside-down cut stem at top) */}
            <line x1="90" y1="164" x2="90" y2="190" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
            {[170, 176, 182, 188].map((y, idx) => (
              <g key={idx}>
                <ellipse cx="81" cy={y} rx="8" ry="3" fill="#22C55E" transform={`rotate(-18 81 ${y})`} />
                <ellipse cx="99" cy={y} rx="8" ry="3" fill="#16A34A" transform={`rotate(18 99 ${y})`} />
              </g>
            ))}

            {/* Rising Oxygen Bubbles */}
            {bubbles.map((b) => (
              <circle
                key={b.id}
                cx={90 + b.xOffset}
                cy={b.y}
                r="3.2"
                fill="#FFFFFF"
                stroke="#0284C7"
                strokeWidth="1"
              />
            ))}

            {/* LED Lamp positioned at distanceCm */}
            <g transform={`translate(${lampX}, 84)`}>
              <rect x="-4" y="54" width="12" height="58" fill="#475569" />
              <rect x="-18" y="110" width="40" height="8" rx="2" fill="#334155" />
              <path d="M -22 10 L 8 10 L 16 48 L -22 48 Z" fill="#1E293B" />
              <ellipse cx="-20" cy="29" rx="5" ry="18" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
              <text x="0" y="-4" textAnchor="middle" className="fill-slate-700 text-[10px] font-mono font-semibold">
                LED ({distanceCm} cm)
              </text>
            </g>

            {/* Metre Ruler Bench Track */}
            <rect x="76" y="206" width="350" height="22" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2" />
            {[0, 10, 20, 30, 40, 50].map((cm) => {
              const x = 90 + cm * 6.1;
              return (
                <g key={cm}>
                  <line x1={x} y1="206" x2={x} y2="215" stroke="#92400E" strokeWidth="1.2" />
                  <text x={x} y="224" textAnchor="middle" className="fill-amber-900 text-[9px] font-mono">
                    {cm}cm
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-2 grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-white p-2.5 font-mono text-xs">
            <div>
              <span className="block text-[10px] text-slate-500">Distance (d)</span>
              <span className="font-semibold text-slate-900">{distanceCm} cm</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500">Light (1/d² ×10⁴)</span>
              <span className="font-semibold text-teal-800">{relativeIntensity} a.u.</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500">Observed Count</span>
              <span className="font-semibold text-slate-900">{observedBubbles} O₂</span>
            </div>
          </div>
        </div>

        {/* Stopwatch & Recording Controls */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800">2. Count O₂ Bubbles Over 60 Seconds</h3>
            <p className="text-xs text-slate-500">
              Start the 60-second virtual timer (10× lab speed) and observe oxygen bubbles stream from the cut stem.
            </p>

            <button
              type="button"
              disabled={counting}
              onClick={handleStartTrial}
              className="w-full rounded-lg bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-45"
            >
              {counting ? `Counting Bubbles… (${elapsedSec.toFixed(0)} s / 60 s)` : 'Start 60 s Bubble Count'}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!counting}
                onClick={() => setManualTaps((t) => t + 1)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-45"
              >
                Tap Tally ({manualTaps})
              </button>
              <button
                type="button"
                onClick={handleCompleteInstant}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Fast-Forward 60 s
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={elapsedSec < 60}
              onClick={handleRecord}
              className="w-full rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Record {distanceCm} cm Rate to Table & Graph
            </button>
            {feedback && (
              <p className="mt-2 text-xs text-teal-800" role="status">
                {feedback}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
