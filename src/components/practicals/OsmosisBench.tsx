import React, { useState } from 'react';
import {
  SUCROSE_CONCENTRATIONS,
  simulatePotatoOsmosis,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

type Stage = 'select' | 'weighedInitial' | 'immersed' | 'blottedFinal';

export const OsmosisBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [concentration, setConcentration] = useState<number>(0.0);
  const [stage, setStage] = useState<Stage>('select');
  const [trialSeed, setTrialSeed] = useState(1);
  const [simResult, setSimResult] = useState(() => simulatePotatoOsmosis(0.0, 2.42, 1));
  const [elapsedMin, setElapsedMin] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectConcentration = (c: number) => {
    setConcentration(c);
    setStage('select');
    setElapsedMin(0);
    const nextSeed = trialSeed + 1;
    setTrialSeed(nextSeed);
    // Natural small variation in freshly bored 30mm potato cylinders (2.35g - 2.55g)
    const initialMass = Number((2.38 + ((nextSeed * 7) % 15) * 0.01).toFixed(2));
    setSimResult(simulatePotatoOsmosis(c, initialMass, nextSeed));
    setFeedback(null);
  };

  const handleCutAndWeighInitial = () => {
    setStage('weighedInitial');
    onCompleteStep(0);
    onCompleteStep(1);
    setFeedback(`Initial mass measured: ${simResult.initialMass.toFixed(2)} g. Now immerse in ${concentration.toFixed(1)} mol/dm³ sucrose.`);
  };

  const handleImmerse = () => {
    setStage('immersed');
    setElapsedMin(30);
    onCompleteStep(2);
    setFeedback('30 minutes elapsed in sucrose solution. Remove cylinder, blot excess moisture, and re-weigh.');
  };

  const handleBlotAndWeighFinal = () => {
    setStage('blottedFinal');
    onCompleteStep(3);
    setFeedback(
      `Final mass: ${simResult.finalMass.toFixed(2)} g (${simResult.percentChange >= 0 ? '+' : ''}${simResult.percentChange.toFixed(1)}%). ${simResult.cellState}.`
    );
  };

  const handleRecordTrial = () => {
    if (stage !== 'blottedFinal') {
      setFeedback('Complete initial weighing, 30 min immersion, and final weighing before recording.');
      return;
    }
    onRecordRow({
      concentration: Number(concentration.toFixed(1)),
      initialMass: simResult.initialMass,
      finalMass: simResult.finalMass,
      massChange: simResult.massChange,
      percentChange: simResult.percentChange,
    });
    onCompleteStep(4);
    onCompleteStep(5);
    setFeedback(
      `Recorded ${concentration.toFixed(1)} mol/dm³ (${simResult.percentChange >= 0 ? '+' : ''}${simResult.percentChange}%). Select the next concentration to plot your osmosis curve.`
    );
  };

  // Visual potato scale reflects turgidity/flaccidity after immersion
  const cylinderScale =
    stage === 'immersed' || stage === 'blottedFinal'
      ? Math.max(0.84, Math.min(1.12, 1 + simResult.percentChange / 150))
      : 1;

  const balanceReading =
    stage === 'select'
      ? '0.00'
      : stage === 'weighedInitial'
      ? simResult.initialMass.toFixed(2)
      : stage === 'immersed'
      ? '0.00'
      : simResult.finalMass.toFixed(2);

  return (
    <div className="space-y-5">
      {/* Concentration Rack Selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Select Sucrose Solution (mol/dm³)</h3>
            <p className="text-xs text-slate-500">
              Test concentrations from pure distilled water (0.0) to concentrated sucrose (1.0 mol/dm³).
            </p>
          </div>
          <span className="font-mono text-xs text-slate-600">Controlled: 30 mm length · 25 cm³ · 30 min</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SUCROSE_CONCENTRATIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleSelectConcentration(c)}
              className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors ${
                concentration === c
                  ? 'border-teal-700 bg-teal-700 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {c.toFixed(1)} M
            </button>
          ))}
        </div>
      </div>

      {/* Apparatus Bench Stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-800">
              Osmosis Bench · {concentration.toFixed(1)} mol/dm³ Sucrose
            </span>
            <span className="font-mono text-slate-600">Timer: {elapsedMin} / 30 min</span>
          </div>

          <svg
            viewBox="0 0 460 250"
            className="h-auto w-full select-none"
            role="img"
            aria-label={`Osmosis apparatus showing digital balance reading ${balanceReading} grams and ${concentration.toFixed(1)} molar sucrose boiling tube`}
          >
            {/* Bench surface */}
            <rect x="0" y="218" width="460" height="32" fill="#E2E8F0" />
            <line x1="0" y1="218" x2="460" y2="218" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* Left: Digital Top-Pan Balance (0.01 g) */}
            <g transform="translate(36, 118)">
              {/* Weighing pan */}
              <rect x="24" y="20" width="112" height="7" rx="2" fill="#94A3B8" />
              <rect x="66" y="27" width="28" height="10" fill="#64748B" />
              {/* Balance body */}
              <path d="M 8 37 L 152 37 L 160 100 L 0 100 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
              {/* LCD readout */}
              <rect x="24" y="54" width="112" height="30" rx="4" fill="#0F172A" />
              <text
                x="126"
                y="75"
                textAnchor="end"
                className="fill-emerald-400 text-[16px] font-mono font-semibold"
              >
                {balanceReading} g
              </text>
              <text x="80" y="114" textAnchor="middle" className="fill-slate-600 text-[10px] font-medium">
                Digital Balance (±0.01 g)
              </text>

              {/* Potato cylinder resting on balance pan when weighing */}
              {(stage === 'weighedInitial' || stage === 'blottedFinal') && (
                <g transform={`translate(80, 14) scale(${cylinderScale})`}>
                  <rect
                    x="-36"
                    y="-10"
                    width="72"
                    height="18"
                    rx="7"
                    fill="#FDE68A"
                    stroke="#B45309"
                    strokeWidth="1.4"
                  />
                  <ellipse cx="-32" cy="-1" rx="4" ry="8" fill="#FCD34D" stroke="#B45309" strokeWidth="1" />
                </g>
              )}
            </g>

            {/* Right: Boiling tube in wooden rack */}
            <g transform="translate(268, 30)">
              {/* Rack shelf behind tube */}
              <rect x="10" y="124" width="128" height="9" rx="2" fill="#D97706" fillOpacity="0.32" stroke="#92400E" />
              <rect x="10" y="182" width="128" height="8" rx="2" fill="#B45309" fillOpacity="0.48" stroke="#92400E" />

              {/* Boiling tube glass */}
              <path
                d="M 48 16 L 48 156 A 26 26 0 0 0 100 156 L 100 16 Z"
                fill="#FFFFFF"
                fillOpacity="0.7"
                stroke="#64748B"
                strokeWidth="2"
              />
              {/* Sucrose solution liquid (slightly denser hue at higher molarity) */}
              <path
                d="M 50 74 L 50 155 A 24 24 0 0 0 98 155 L 98 74 Z"
                fill="#0EA5E9"
                fillOpacity={0.16 + concentration * 0.24}
              />
              {/* Liquid meniscus */}
              <ellipse cx="74" cy="74" rx="24" ry="3.5" fill="#38BDF8" fillOpacity="0.32" />

              {/* Potato cylinder submerged inside tube */}
              {stage === 'immersed' && (
                <g transform={`translate(74, 134) rotate(-78) scale(${cylinderScale})`}>
                  <rect
                    x="-34"
                    y="-9"
                    width="68"
                    height="18"
                    rx="7"
                    fill="#FDE68A"
                    stroke="#B45309"
                    strokeWidth="1.4"
                  />
                </g>
              )}

              {/* Tube label cleanly positioned above liquid */}
              <rect x="44" y="34" width="60" height="20" rx="3" fill="#FFFFFF" stroke="#CBD5E1" />
              <text x="74" y="47" textAnchor="middle" className="fill-slate-800 text-[10px] font-mono font-semibold">
                {concentration.toFixed(1)} M
              </text>
              <text x="74" y="204" textAnchor="middle" className="fill-slate-600 text-[10px] font-medium">
                25 cm³ Sucrose Solution
              </text>
            </g>
          </svg>

          {/* Cell state readout */}
          <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Tissue Status: </span>
            {stage === 'select' && 'Cut and blot a fresh 30 mm potato cylinder to start.'}
            {stage === 'weighedInitial' && `Initial mass ${simResult.initialMass.toFixed(2)} g recorded on balance. Ready to immerse.`}
            {stage === 'immersed' && `Immersed for 30 min in ${concentration.toFixed(1)} mol/dm³ sucrose. Blot dry before final weighing.`}
            {stage === 'blottedFinal' && simResult.cellState}
          </div>
        </div>

        {/* Sequential Action Controls */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-800">2. Carry Out Procedure</h3>

            <button
              type="button"
              onClick={handleCutAndWeighInitial}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                stage !== 'select'
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {stage !== 'select' ? '✓ ' : ''}Step 1: Cut, Blot & Weigh Initial Mass
            </button>

            <button
              type="button"
              disabled={stage === 'select'}
              onClick={handleImmerse}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                stage === 'immersed' || stage === 'blottedFinal'
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {stage === 'immersed' || stage === 'blottedFinal' ? '✓ ' : ''}Step 2: Immerse for 30 Minutes
            </button>

            <button
              type="button"
              disabled={stage !== 'immersed' && stage !== 'blottedFinal'}
              onClick={handleBlotAndWeighFinal}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                stage === 'blottedFinal'
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {stage === 'blottedFinal' ? '✓ ' : ''}Step 3: Blot Dry & Weigh Final Mass
            </button>
          </div>

          {/* Live Calculation Summary */}
          <div className="border-t border-slate-200 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 font-mono text-xs">
              <div>
                <span className="block text-[10px] text-slate-500">Initial Mass</span>
                <span className="font-semibold text-slate-900">
                  {stage !== 'select' ? `${simResult.initialMass.toFixed(2)} g` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Final Mass</span>
                <span className="font-semibold text-slate-900">
                  {stage === 'blottedFinal' ? `${simResult.finalMass.toFixed(2)} g` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Mass Change</span>
                <span className="font-semibold text-slate-900">
                  {stage === 'blottedFinal'
                    ? `${simResult.massChange >= 0 ? '+' : ''}${simResult.massChange.toFixed(2)} g`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">% Change</span>
                <span
                  className={`font-semibold ${
                    stage !== 'blottedFinal'
                      ? 'text-slate-900'
                      : simResult.percentChange >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {stage === 'blottedFinal'
                    ? `${simResult.percentChange >= 0 ? '+' : ''}${simResult.percentChange.toFixed(1)}%`
                    : '—'}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={stage !== 'blottedFinal'}
              onClick={handleRecordTrial}
              className="mt-3 w-full rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Record Trial to Table & Graph
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
