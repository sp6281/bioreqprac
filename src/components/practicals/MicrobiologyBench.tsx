import React, { useState } from 'react';
import {
  ANTIMICROBIAL_AGENTS,
  type AntimicrobialAgentId,
  simulateZoneDiameterMm,
  calculateZoneAreaMm2,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

const QUADRANT_POSITIONS: Record<AntimicrobialAgentId, { cx: number; cy: number; labelX: number; labelY: number }> = {
  water: { cx: 112, cy: 112, labelX: 78, labelY: 78 },
  antisepticA: { cx: 208, cy: 112, labelX: 242, labelY: 78 },
  antisepticB: { cx: 112, cy: 208, labelX: 78, labelY: 245 },
  penicillin: { cx: 208, cy: 208, labelX: 242, labelY: 245 },
};

export const MicrobiologyBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [benchDisinfected, setBenchDisinfected] = useState(false);
  const [forcepsFlamed, setForcepsFlamed] = useState(false);
  const [lidTwoTape, setLidTwoTape] = useState(false);
  const [placedDiscs, setPlacedDiscs] = useState<AntimicrobialAgentId[]>([]);
  const [incubated, setIncubated] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AntimicrobialAgentId>('penicillin');
  const [rulerOffsetMm, setRulerOffsetMm] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const asepticComplete = benchDisinfected && forcepsFlamed && lidTwoTape;

  const diameters: Record<AntimicrobialAgentId, number> = {
    water: simulateZoneDiameterMm('water', 1),
    antisepticA: simulateZoneDiameterMm('antisepticA', 2),
    antisepticB: simulateZoneDiameterMm('antisepticB', 3),
    penicillin: simulateZoneDiameterMm('penicillin', 4),
  };

  const toggleDisc = (id: AntimicrobialAgentId) => {
    if (incubated) return;
    setPlacedDiscs((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      if (next.length === 4) onCompleteStep(1);
      return next;
    });
  };

  const handleIncubate = () => {
    if (placedDiscs.length === 0) {
      setFeedback('Place at least one antimicrobial filter paper disc on the agar before incubating.');
      return;
    }
    setIncubated(true);
    onCompleteStep(2);
    onCompleteStep(3);
    setFeedback(
      asepticComplete
        ? 'Incubated 48 h at 25 °C cleanly. Select a quadrant below to measure its clear zone diameter.'
        : 'Incubated 48 h at 25 °C — stray fungal contamination spots appeared because aseptic checks were skipped.'
    );
  };

  const handleResetPlate = () => {
    setPlacedDiscs([]);
    setIncubated(false);
    setFeedback(null);
  };

  const handleRecordZone = () => {
    if (!incubated || !placedDiscs.includes(selectedAgent)) {
      setFeedback('Incubate the agar plate with this disc placed before recording.');
      return;
    }
    const agent = ANTIMICROBIAL_AGENTS[selectedAgent];
    const diam = diameters[selectedAgent];
    const radius = Number((diam / 2).toFixed(1));
    const area = calculateZoneAreaMm2(diam);
    onRecordRow({
      agent: agent.label,
      diameterMm: diam,
      radiusMm: radius,
      areaMm2: area,
      aseptic: asepticComplete ? 'Clean (Aseptic)' : 'Contaminated',
    });
    onCompleteStep(4);
    onCompleteStep(5);
    setFeedback(`Recorded ${agent.label}: diameter ${diam} mm, area = π × ${radius}² = ${area} mm².`);
  };

  // Convert mm to SVG px (1 mm = 2.4 px on the 320×320 plate where plate diameter is ~90 mm)
  const mmToPx = 2.35;
  const activePos = QUADRANT_POSITIONS[selectedAgent];
  const activeDiamMm = diameters[selectedAgent];

  return (
    <div className="space-y-5">
      {/* Aseptic Technique Preparation Strip */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Aseptic Technique Preparation</h3>
            <p className="text-xs text-slate-500">
              Prevent unwanted microorganisms from contaminating the agar plate before incubation at 25 °C.
            </p>
          </div>
          <span className={`font-mono text-xs font-medium ${asepticComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
            {asepticComplete ? '● Aseptic Protocol Ready' : '▲ Incomplete Aseptic Checks'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              setBenchDisinfected(true);
              if (forcepsFlamed) onCompleteStep(0);
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              benchDisinfected
                ? 'border-teal-600 bg-teal-50 text-teal-800'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {benchDisinfected ? '✓ Disinfect Bench' : 'Disinfect Lab Bench'}
          </button>
          <button
            type="button"
            onClick={() => {
              setForcepsFlamed(true);
              if (benchDisinfected) onCompleteStep(0);
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              forcepsFlamed
                ? 'border-teal-600 bg-teal-50 text-teal-800'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {forcepsFlamed ? '✓ Flame Forceps' : 'Flame Sterilise Forceps'}
          </button>
          <button
            type="button"
            onClick={() => {
              setLidTwoTape(true);
              onCompleteStep(2);
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              lidTwoTape
                ? 'border-teal-600 bg-teal-50 text-teal-800'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {lidTwoTape ? '✓ Tape Lid (2 Points Only)' : 'Tape Lid at 2 Points & Invert'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Agar Plate Visual Stage */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-2 flex w-full items-center justify-between text-xs text-slate-600">
            <span className="font-medium text-slate-800">Nutrient Agar Petri Dish (90 mm)</span>
            <span className="font-mono text-slate-500">
              {incubated ? 'Incubated: 48 h @ 25 °C' : 'Unincubated (0 h)'}
            </span>
          </div>

          <svg
            viewBox="0 0 320 320"
            className="h-72 w-72 select-none"
            role="img"
            aria-label="Nutrient agar plate with four antimicrobial filter paper discs and zones of inhibition"
          >
            {/* Outer glass petri rim */}
            <circle cx="160" cy="160" r="144" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="3" />
            {/* Agar surface — clouds over with bacterial lawn after incubation */}
            <circle
              cx="160"
              cy="160"
              r="134"
              fill={incubated ? '#E5D39E' : '#FEF9E7'}
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Quadrant marker lines drawn on base */}
            <line x1="28" y1="160" x2="292" y2="160" stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.6" />
            <line x1="160" y1="28" x2="160" y2="292" stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.6" />

            {/* Bacterial lawn texture speckles when incubated */}
            {incubated && (
              <g fill="#C9B273" fillOpacity="0.45">
                {Array.from({ length: 48 }).map((_, i) => {
                  const angle = i * 2.39996;
                  const r = 18 + Math.sqrt(i / 48) * 108;
                  return <circle key={i} cx={160 + Math.cos(angle) * r} cy={160 + Math.sin(angle) * r} r="2.2" />;
                })}
              </g>
            )}

            {/* Contamination colonies if aseptic skipped */}
            {incubated && !asepticComplete && (
              <g>
                <circle cx="152" cy="72" r="9" fill="#64748B" fillOpacity="0.7" />
                <circle cx="152" cy="72" r="5" fill="#334155" fillOpacity="0.8" />
                <circle cx="248" cy="155" r="7" fill="#64748B" fillOpacity="0.65" />
              </g>
            )}

            {/* Clear Zones of Inhibition + Filter Paper Discs */}
            {(Object.keys(ANTIMICROBIAL_AGENTS) as AntimicrobialAgentId[]).map((id) => {
              const agent = ANTIMICROBIAL_AGENTS[id];
              const pos = QUADRANT_POSITIONS[id];
              const isPlaced = placedDiscs.includes(id);
              const zoneRadiusPx = (diameters[id] / 2) * mmToPx;
              const isSelected = selectedAgent === id;

              return (
                <g key={id} className="cursor-pointer" onClick={() => setSelectedAgent(id)}>
                  <text
                    x={pos.labelX}
                    y={pos.labelY}
                    textAnchor="middle"
                    className="fill-slate-700 text-[11px] font-mono font-semibold"
                  >
                    {agent.shortCode}
                  </text>

                  {/* Clear zone where bacteria could not grow */}
                  {incubated && isPlaced && diameters[id] > 6 && (
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r={zoneRadiusPx}
                      fill="#FFFDF5"
                      stroke={isSelected ? '#0F766E' : '#B49F62'}
                      strokeWidth={isSelected ? '2' : '1'}
                      strokeDasharray={isSelected ? '3 2' : undefined}
                    />
                  )}

                  {/* 6 mm white filter paper disc */}
                  {isPlaced && (
                    <g>
                      <circle
                        cx={pos.cx}
                        cy={pos.cy}
                        r={3 * mmToPx}
                        fill="#FFFFFF"
                        stroke="#475569"
                        strokeWidth="1.2"
                      />
                      <text
                        x={pos.cx}
                        y={pos.cy + 3.5}
                        textAnchor="middle"
                        className="fill-slate-800 text-[8px] font-mono font-bold"
                      >
                        {agent.shortCode}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Interactive Transparent Millimetre Ruler Overlay on selected quadrant */}
            {incubated && placedDiscs.includes(selectedAgent) && (
              <g transform={`translate(${activePos.cx - 47 + rulerOffsetMm * mmToPx}, ${activePos.cy - 10})`}>
                <rect
                  x="0"
                  y="0"
                  width="94"
                  height="20"
                  rx="2"
                  fill="#0F172A"
                  fillOpacity="0.12"
                  stroke="#0F766E"
                  strokeWidth="1"
                />
                {Array.from({ length: 41 }).map((_, mm) => {
                  const x = mm * mmToPx;
                  const major = mm % 10 === 0;
                  const mid = mm % 5 === 0;
                  return (
                    <line
                      key={mm}
                      x1={x}
                      y1="0"
                      x2={x}
                      y2={major ? 10 : mid ? 7 : 4}
                      stroke="#0F172A"
                      strokeWidth={major ? '1.1' : '0.6'}
                    />
                  );
                })}
              </g>
            )}
          </svg>

          {incubated && (
            <div className="mt-3 w-full max-w-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <label htmlFor="ruler-align">Fine-align mm ruler across clear zone</label>
                <span className="font-mono font-semibold text-teal-800">
                  Measured: {activeDiamMm.toFixed(1)} mm
                </span>
              </div>
              <input
                id="ruler-align"
                type="range"
                min={-6}
                max={6}
                step={0.5}
                value={rulerOffsetMm}
                onChange={(e) => setRulerOffsetMm(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">2. Place Antimicrobial Discs</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Click each disc to place it on its quadrant before incubating.
              </p>
              <div className="mt-2.5 grid grid-cols-1 gap-2">
                {(Object.keys(ANTIMICROBIAL_AGENTS) as AntimicrobialAgentId[]).map((id) => {
                  const agent = ANTIMICROBIAL_AGENTS[id];
                  const placed = placedDiscs.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={incubated}
                      onClick={() => toggleDisc(id)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-70 ${
                        placed
                          ? 'border-teal-600 bg-teal-50 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        <span className="mr-2 font-mono font-bold">[{agent.shortCode}]</span>
                        {agent.label}
                      </span>
                      <span className="font-mono text-[11px]">{placed ? 'Placed' : 'Place disc'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={incubated || placedDiscs.length === 0}
                onClick={handleIncubate}
                className="flex-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {incubated ? 'Incubated (48 h @ 25 °C)' : 'Incubate 48 h at 25 °C'}
              </button>
              <button
                type="button"
                onClick={handleResetPlate}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                New Plate
              </button>
            </div>
          </div>

          {/* Measurement & Record */}
          <div className="border-t border-slate-200 pt-4">
            <label htmlFor="select-zone-agent" className="block text-xs font-semibold text-slate-800">
              3. Measure & Record Clear Zone
            </label>
            <select
              id="select-zone-agent"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value as AntimicrobialAgentId)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              {(Object.keys(ANTIMICROBIAL_AGENTS) as AntimicrobialAgentId[]).map((id) => (
                <option key={id} value={id}>
                  [{ANTIMICROBIAL_AGENTS[id].shortCode}] {ANTIMICROBIAL_AGENTS[id].label}
                </option>
              ))}
            </select>

            {incubated && placedDiscs.includes(selectedAgent) && (
              <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-2.5 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-slate-500">Diameter</span>
                  <span className="font-semibold text-slate-900">{activeDiamMm} mm</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Radius (r)</span>
                  <span className="font-semibold text-slate-900">{(activeDiamMm / 2).toFixed(1)} mm</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Area (πr²)</span>
                  <span className="font-semibold text-teal-800">{calculateZoneAreaMm2(activeDiamMm)} mm²</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!incubated}
              onClick={handleRecordZone}
              className="mt-3 w-full rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Record Zone Area to Table
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
