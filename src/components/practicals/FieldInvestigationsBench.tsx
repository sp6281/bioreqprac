import React, { useMemo, useState } from 'react';
import {
  generateMeadowDaisies,
  countDaisiesInQuadrat,
  estimateTotalPopulation,
  getTransectLightLux,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

type SamplingMode = 'random' | 'transect';
const TRANSECT_DISTANCES = [0, 2, 4, 6, 8, 9.5] as const;

export const FieldInvestigationsBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const daisies = useMemo(() => generateMeadowDaisies(42), []);
  const [mode, setMode] = useState<SamplingMode>('random');
  const [quadratX, setQuadratX] = useState<number>(4.5);
  const [quadratY, setQuadratY] = useState<number>(4.5);
  const [randomCounts, setRandomCounts] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const daisiesInBox = useMemo(
    () => countDaisiesInQuadrat(daisies, quadratX, quadratY, 0.5),
    [daisies, quadratX, quadratY]
  );

  const lightLux = getTransectLightLux(quadratX);
  const estimatedPop = estimateTotalPopulation(randomCounts, 100, 0.25);

  const handleGenerateRandomCoords = () => {
    const rx = Number((Math.floor(Math.random() * 19) * 0.5).toFixed(1));
    const ry = Number((Math.floor(Math.random() * 19) * 0.5).toFixed(1));
    setQuadratX(rx);
    setQuadratY(ry);
    onCompleteStep(0);
    setFeedback(`Placed 0.5 m × 0.5 m quadrat randomly at (${rx} m, ${ry} m). Count the daisies inside the zoomed frame.`);
  };

  const handleSelectTransectDist = (distM: number) => {
    setQuadratX(distM);
    setQuadratY(4.75);
    onCompleteStep(3);
    setFeedback(`Sampled belt transect at ${distM} m from oak trunk — Light meter: ${getTransectLightLux(distM)} lux.`);
  };

  const handleRecordSample = () => {
    const count = daisiesInBox.length;
    if (mode === 'random') {
      const updated = [...randomCounts, count];
      setRandomCounts(updated);
      onRecordRow({
        mode: 'Random Quadrat',
        position: Number(quadratX.toFixed(1)),
        lightLux,
        daisyCount: count,
      });
      onCompleteStep(1);
      if (updated.length >= 3) onCompleteStep(2);
      setFeedback(
        `Recorded random quadrat (${quadratX} m, ${quadratY} m): ${count} daisies. Running population estimate: ~${estimateTotalPopulation(
          updated
        ).toLocaleString()} daisies across 100 m².`
      );
    } else {
      onRecordRow({
        mode: 'Belt Transect',
        position: Number(quadratX.toFixed(1)),
        lightLux,
        daisyCount: count,
      });
      onCompleteStep(4);
      onCompleteStep(5);
      setFeedback(`Recorded transect at ${quadratX} m: ${lightLux} lux, ${count} daisies per 0.25 m².`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Mode Switcher */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Choose Ecological Sampling Method</h3>
            <p className="text-xs text-slate-500">
              Use unbiased random coordinates to estimate total population, or run a belt transect away from oak tree shade.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('random');
                setFeedback(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                mode === 'random' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Random Sampling (Population)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('transect');
                setQuadratX(0);
                setQuadratY(4.75);
                onCompleteStep(3);
                setFeedback(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                mode === 'transect' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belt Transect (Light Gradient)
            </button>
          </div>
        </div>

        {mode === 'transect' && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TRANSECT_DISTANCES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSelectTransectDist(d)}
                className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors ${
                  quadratX === d
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {d} m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Meadow Map + Zoomed Quadrat Inspector */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-800">10 m × 10 m Meadow Study Site (100 m²)</span>
            <span className="font-mono text-slate-600">
              Quadrat: ({quadratX} m, {quadratY} m) · {lightLux.toLocaleString()} lux
            </span>
          </div>

          <svg
            viewBox="0 0 340 310"
            className="h-auto w-full select-none rounded border border-slate-200 bg-emerald-100"
            role="img"
            aria-label={`Ten by ten metre meadow with oak tree shade on left and quadrat placed at ${quadratX} metres`}
          >
            {/* Meadow turf */}
            <rect x="30" y="16" width="280" height="260" fill="#BBF7D0" />
            {/* Oak tree shade gradient on left edge (0 m to 4 m) */}
            <defs>
              <linearGradient id="oakShade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14532D" stopOpacity="0.52" />
                <stop offset="55%" stopColor="#14532D" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#14532D" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="30" y="16" width="175" height="260" fill="url(#oakShade)" />
            <text x="38" y="34" className="fill-emerald-950 text-[10px] font-semibold">
              Oak Canopy (Shade)
            </text>
            <text x="298" y="34" textAnchor="end" className="fill-emerald-900 text-[10px] font-semibold">
              Open Sun →
            </text>

            {/* 1m Gridlines */}
            {Array.from({ length: 11 }).map((_, m) => {
              const x = 30 + m * 28;
              const y = 16 + m * 26;
              return (
                <g key={m}>
                  <line x1={x} y1="16" x2={x} y2="276" stroke="#15803D" strokeOpacity="0.15" />
                  <line x1="30" y1={y} x2="310" y2={y} stroke="#15803D" strokeOpacity="0.15" />
                  {m % 2 === 0 && (
                    <text x={x} y="294" textAnchor="middle" className="fill-slate-600 text-[9px] font-mono">
                      {m}m
                    </text>
                  )}
                </g>
              );
            })}

            {/* Belt transect tape line when in transect mode */}
            {mode === 'transect' && (
              <line
                x1="30"
                y1={16 + 5 * 26}
                x2="310"
                y2={16 + 5 * 26}
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeDasharray="6 3"
              />
            )}

            {/* Meadow daisy dots (sub-sampled visual representation for crispness) */}
            {daisies.filter((_, i) => i % 2 === 0).map((d) => (
              <circle
                key={d.id}
                cx={30 + d.x * 28}
                cy={16 + d.y * 26}
                r="1.7"
                fill="#FFFFFF"
                stroke="#EAB308"
                strokeWidth="0.6"
              />
            ))}

            {/* Active 0.5m × 0.5m Quadrat Frame */}
            <rect
              x={30 + quadratX * 28}
              y={16 + quadratY * 26}
              width="14"
              height="13"
              fill="#0F766E"
              fillOpacity="0.25"
              stroke="#0F172A"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Zoomed Quadrat Inspector & Controls */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800">2. Zoomed Quadrat (0.5 m × 0.5 m)</h3>
              <span className="font-mono text-xs font-bold text-teal-800">
                {daisiesInBox.length} daisies
              </span>
            </div>

            {/* 5×5 sub-grid quadrat frame */}
            <svg
              viewBox="0 0 180 180"
              className="mx-auto h-40 w-40 rounded border-2 border-slate-800 bg-emerald-100"
              role="img"
              aria-label={`Zoomed quadrat frame showing ${daisiesInBox.length} daisies`}
            >
              {[1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line x1={i * 36} y1="0" x2={i * 36} y2="180" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
                  <line x1="0" y1={i * 36} x2="180" y2={i * 36} stroke="#475569" strokeWidth="0.8" strokeOpacity="0.5" />
                </g>
              ))}
              {daisiesInBox.map((d) => {
                const lx = ((d.x - quadratX) / 0.5) * 164 + 8;
                const ly = ((d.y - quadratY) / 0.5) * 164 + 8;
                return (
                  <g key={d.id} transform={`translate(${lx}, ${ly})`}>
                    <circle r="6" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.7" />
                    <circle r="2.6" fill="#FACC15" />
                  </g>
                );
              })}
            </svg>

            {mode === 'random' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerateRandomCoords}
                  className="w-full rounded-lg bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Generate Random Coordinates
                </button>
                <div className="rounded-md bg-slate-50 p-2.5 font-mono text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Samples taken:</span>
                    <span className="font-semibold">{randomCounts.length}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>Est. 100 m² Population:</span>
                    <span className="font-semibold text-teal-800">
                      {randomCounts.length > 0 ? estimatedPop.toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-slate-50 p-2.5 font-mono text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Transect Distance:</span>
                  <span className="font-semibold">{quadratX} m from oak</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Light Intensity:</span>
                  <span className="font-semibold text-amber-700">{lightLux.toLocaleString()} lux</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleRecordSample}
              className="w-full rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800"
            >
              Record Quadrat Count to Table
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
