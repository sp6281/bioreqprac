import React, { useState } from 'react';
import {
  type LightConditionId,
  simulateSeedlingDish,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

const CONDITIONS: LightConditionId[] = ['fullLight', 'directionalLight', 'darkness'];

export const PlantResponsesBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [day, setDay] = useState<number>(0);
  const [watered, setWatered] = useState<boolean>(true);
  const [selectedDish, setSelectedDish] = useState<LightConditionId>('directionalLight');
  const [rulerHeightMm, setRulerHeightMm] = useState<number>(35);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeDish = simulateSeedlingDish(selectedDish, day, watered);

  const handleDayChange = (nextDay: number) => {
    setDay(nextDay);
    onCompleteStep(0);
    if (nextDay >= 3) onCompleteStep(1);
    if (nextDay >= 5) onCompleteStep(2);
  };

  const handleRecordDish = () => {
    if (day < 1) {
      setFeedback('Advance growth to at least Day 1 (Day 7 recommended) before recording seedling height.');
      return;
    }
    onRecordRow({
      condition: activeDish.label,
      day,
      meanHeightMm: activeDish.meanHeightMm,
      bendAngle: activeDish.bendAngleDeg,
      appearance: activeDish.appearance,
    });
    onCompleteStep(3);
    onCompleteStep(4);
    onCompleteStep(5);
    setFeedback(
      `Recorded ${activeDish.label} (Day ${day}): mean height ${activeDish.meanHeightMm} mm, tilt ${activeDish.bendAngleDeg}°. Compare all 3 dishes.`
    );
  };

  return (
    <div className="space-y-5">
      {/* Growth Timeline & Condition Selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Seedling Growth Chamber (Days 0 – 7)</h3>
            <p className="text-xs text-slate-500">
              Compare 5 mustard/cress seedlings in each light condition to observe positive phototropism and etiolation.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={watered}
              onChange={(e) => {
                setWatered(e.target.checked);
                onCompleteStep(0);
              }}
              className="rounded border-slate-300"
            />
            Keep cotton wool damp (controlled water)
          </label>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="growth-day-slider" className="font-medium text-slate-700">
              Growth Elapsed
            </label>
            <span className="font-mono font-semibold text-teal-800">Day {day} of 7</span>
          </div>
          <input
            id="growth-day-slider"
            type="range"
            min={0}
            max={7}
            step={1}
            value={day}
            onChange={(e) => handleDayChange(Number(e.target.value))}
            className="mt-1.5 w-full cursor-pointer"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
              <span key={d}>D{d}</span>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {CONDITIONS.map((id) => {
            const label =
              id === 'fullLight'
                ? 'Dish A: Full Light'
                : id === 'directionalLight'
                ? 'Dish B: Side Light Slit'
                : 'Dish C: Complete Darkness';
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedDish(id)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  selectedDish === id
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seedling Observation Chamber */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-800">{activeDish.label}</span>
            <span className="font-mono text-slate-600">
              Mean height: {activeDish.meanHeightMm} mm · Tilt: {activeDish.bendAngleDeg}°
            </span>
          </div>

          <svg
            viewBox="0 0 440 250"
            className="h-auto w-full select-none rounded-md border border-slate-200"
            role="img"
            aria-label={`Five cress seedlings growing under ${activeDish.label} on day ${day}`}
          >
            {/* Chamber background based on light condition */}
            <rect
              x="0"
              y="0"
              width="440"
              height="250"
              fill={
                selectedDish === 'fullLight'
                  ? '#FEFCE8'
                  : selectedDish === 'directionalLight'
                  ? '#1E293B'
                  : '#0F172A'
              }
            />

            {/* Overhead sun rays for Full Light */}
            {selectedDish === 'fullLight' && (
              <g stroke="#FACC15" strokeWidth="2" strokeOpacity="0.55">
                {[80, 150, 220, 290, 360].map((x) => (
                  <line key={x} x1={x} y1="6" x2={x} y2="38" />
                ))}
              </g>
            )}

            {/* Side slit beam for Directional Light */}
            {selectedDish === 'directionalLight' && (
              <g>
                <rect x="428" y="68" width="12" height="44" fill="#FEF08A" />
                <polygon points="428,68 428,112 95,195 95,130" fill="#FEF08A" fillOpacity="0.22" />
                <text x="418" y="58" textAnchor="end" className="fill-amber-200 text-[10px] font-mono">
                  Light slit →
                </text>
              </g>
            )}

            {/* Petri dish + damp cotton wool base */}
            <rect x="76" y="198" width="288" height="24" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
            <rect
              x="82"
              y="194"
              width="276"
              height="12"
              rx="4"
              fill={watered ? '#E0F2FE' : '#F8FAFC'}
              stroke="#CBD5E1"
            />

            {/* Five growing seedlings */}
            {activeDish.shootHeightsMm.map((hMm, idx) => {
              const baseX = 115 + idx * 52;
              const baseY = 196;
              // Scale: 1 mm = 2.4 px
              const lenPx = Math.min(165, hMm * 2.4);
              const rad = (activeDish.bendAngleDeg * Math.PI) / 180;
              const tipX = baseX + Math.sin(rad) * lenPx;
              const tipY = baseY - Math.cos(rad) * lenPx;
              const ctrlX = baseX + Math.sin(rad) * lenPx * 0.35;
              const ctrlY = baseY - lenPx * 0.65;

              return (
                <g key={idx}>
                  <path
                    d={`M ${baseX} ${baseY} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`}
                    fill="none"
                    stroke={activeDish.stemColorHex}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  {/* Cotyledon seed leaves */}
                  {day >= 1 && (
                    <g transform={`translate(${tipX}, ${tipY}) rotate(${activeDish.bendAngleDeg})`}>
                      <ellipse cx="-6" cy="-2" rx="6.5" ry="3.2" fill={activeDish.leafColorHex} transform="rotate(-25 -6 -2)" />
                      <ellipse cx="6" cy="-2" rx="6.5" ry="3.2" fill={activeDish.leafColorHex} transform="rotate(25 6 -2)" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Interactive Vertical Millimetre Ruler */}
            <g transform="translate(24, 16)">
              <rect x="0" y="0" width="32" height="180" fill="#FFFFFF" fillOpacity="0.9" stroke="#64748B" />
              {[0, 10, 20, 30, 40, 50, 60, 70].map((mm) => {
                const y = 180 - mm * 2.4;
                if (y < 4) return null;
                return (
                  <g key={mm}>
                    <line x1="20" y1={y} x2="32" y2={y} stroke="#334155" strokeWidth="1" />
                    <text x="17" y={y + 3} textAnchor="end" className="fill-slate-700 text-[8px] font-mono">
                      {mm}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Draggable horizontal sightline guide */}
            <line
              x1="56"
              y1={196 - rulerHeightMm * 2.4}
              x2="390"
              y2={196 - rulerHeightMm * 2.4}
              stroke="#14B8A6"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <text
              x="394"
              y={199 - rulerHeightMm * 2.4}
              className="fill-teal-400 text-[10px] font-mono font-semibold"
            >
              {rulerHeightMm}mm
            </text>
          </svg>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <label htmlFor="shoot-ruler-guide">Align horizontal measuring guide with shoot tips</label>
              <span className="font-mono font-semibold text-teal-800">{rulerHeightMm} mm</span>
            </div>
            <input
              id="shoot-ruler-guide"
              type="range"
              min={5}
              max={70}
              step={1}
              value={rulerHeightMm}
              onChange={(e) => setRulerHeightMm(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </div>
        </div>

        {/* Individual Measurements & Recording */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800">2. Individual Seedling Heights (Day {day})</h3>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
              {activeDish.shootHeightsMm.map((h, i) => (
                <div key={i} className="rounded border border-slate-200 bg-slate-50 py-2">
                  <span className="block text-[9px] text-slate-500">#{i + 1}</span>
                  <span className="font-semibold text-slate-900">{h}</span>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Hormone Mechanism (Auxin): </span>
              {selectedDish === 'fullLight' &&
                'Even overhead light distributes auxin evenly down both sides of the shoot, producing straight, compact green stems.'}
              {selectedDish === 'directionalLight' &&
                'Auxin migrates to the shaded side of the shoot, stimulating greater cell elongation there so the stem bends toward the light slit.'}
              {selectedDish === 'darkness' &&
                'Without light, auxin triggers rapid vertical elongation (etiolation) as the seedling searches for light, with minimal chlorophyll (yellow leaves).'}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={day < 1}
              onClick={handleRecordDish}
              className="w-full rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Record {activeDish.label} (Day {day})
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
