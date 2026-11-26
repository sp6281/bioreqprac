import React, { useEffect, useState } from 'react';
import {
  DECAY_TEMPS_C,
  simulateMilkDecayTimeSec,
  getMilkDecayStateAtTime,
  calculateRatePerThousandSec,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

export const DecayBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [tempC, setTempC] = useState<number>(30);
  const [seed, setSeed] = useState<number>(1);
  const [lipaseAdded, setLipaseAdded] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const endpointSec = simulateMilkDecayTimeSec(tempC, seed);
  const state = lipaseAdded
    ? getMilkDecayStateAtTime(elapsedSec, endpointSec)
    : { ph: 8.6, colorHex: '#9333EA', label: 'Purple (Alkaline milk + Na₂CO₃ + Cresol red)', finished: false };

  const handleSelectTemp = (t: number) => {
    setTempC(t);
    setSeed((s) => s + 1);
    setLipaseAdded(false);
    setRunning(false);
    setElapsedSec(0);
    setFeedback(null);
    onCompleteStep(0);
    onCompleteStep(1);
  };

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 4; // 100ms real = 4s simulated for smooth observation
        if (endpointSec !== null && next >= endpointSec) {
          setRunning(false);
          onCompleteStep(3);
          return endpointSec;
        }
        if (endpointSec === null && next >= 240) {
          setRunning(false);
          onCompleteStep(3);
          return 240;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [running, endpointSec, onCompleteStep]);

  const handleAddLipase = () => {
    setLipaseAdded(true);
    setElapsedSec(0);
    setRunning(true);
    onCompleteStep(2);
    setFeedback(
      tempC >= 60
        ? 'Lipase added at 60 °C — high temperature denatures the active site so pH remains alkaline.'
        : `Lipase added at ${tempC} °C — watch the pH drop as lipids break down into fatty acids.`
    );
  };

  const handleFastForward = () => {
    setLipaseAdded(true);
    setRunning(false);
    if (endpointSec === null) {
      setElapsedSec(240);
      setFeedback('240 s elapsed at 60 °C: solution remained purple (lipase denatured).');
    } else {
      setElapsedSec(endpointSec);
      setFeedback(`Endpoint reached at ${endpointSec} s: Cresol red turned bright yellow (pH 7.15).`);
    }
    onCompleteStep(2);
    onCompleteStep(3);
  };

  const canRecord = lipaseAdded && (state.finished || (endpointSec === null && elapsedSec >= 240));

  const handleRecordResult = () => {
    if (!canRecord) {
      setFeedback('Add lipase and wait until the Cresol red turns yellow (or 240 s at 60 °C) before recording.');
      return;
    }
    const recordedTime = endpointSec ?? 240;
    const rate = endpointSec !== null ? calculateRatePerThousandSec(endpointSec) : 0;
    onRecordRow({
      tempC,
      timeSec: recordedTime,
      finalPh: state.ph,
      rate,
      note: endpointSec !== null ? 'Turned yellow (decayed)' : 'Stayed purple (denatured)',
    });
    onCompleteStep(4);
    onCompleteStep(5);
    setFeedback(`Recorded ${tempC} °C: ${endpointSec !== null ? `${recordedTime} s (rate ${rate})` : 'Denatured (rate 0)'}.`);
  };

  return (
    <div className="space-y-5">
      {/* Water Bath Temperature Selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Set Thermostatic Water Bath Temperature</h3>
            <p className="text-xs text-slate-500">
              Equilibrate milk + Na₂CO₃ + Cresol red and lipase at the chosen temperature before mixing.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-600">Indicator: Cresol Red (Purple → Yellow)</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DECAY_TEMPS_C.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleSelectTemp(t)}
              className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors ${
                tempC === t
                  ? 'border-teal-700 bg-teal-700 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t} °C
            </button>
          ))}
        </div>
      </div>

      {/* Boiling Tube & Digital pH Probe Stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-800">Milk + Lipase + Cresol Red ({tempC} °C)</span>
            <span className="font-mono text-slate-600">Stopwatch: {elapsedSec} s</span>
          </div>

          <svg
            viewBox="0 0 420 245"
            className="h-auto w-full select-none"
            role="img"
            aria-label={`Milk decay tube at ${tempC} degrees Celsius showing pH ${state.ph} and ${state.label}`}
          >
            {/* Water bath tank */}
            <rect x="34" y="106" width="212" height="122" rx="8" fill="#E0F2FE" fillOpacity="0.65" stroke="#0284C7" strokeWidth="1.5" />
            <text x="140" y="218" textAnchor="middle" className="fill-sky-900 text-[10px] font-mono font-semibold">
              Thermostatic Water Bath · {tempC}.0 °C
            </text>

            {/* Boiling tube inside water bath */}
            <path
              d="M 108 34 L 108 176 A 32 32 0 0 0 172 176 L 172 34 Z"
              fill="#FFFFFF"
              fillOpacity="0.85"
              stroke="#64748B"
              strokeWidth="2"
            />
            {/* Milk + Cresol red solution smoothly transitioning color */}
            <path
              d="M 110 88 L 110 175 A 30 30 0 0 0 170 175 L 170 88 Z"
              fill={state.colorHex}
              fillOpacity="0.88"
              className="transition-colors duration-300"
            />

            {/* pH Probe inserted into tube */}
            <line x1="140" y1="18" x2="140" y2="152" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <path d="M 140 18 Q 200 10 264 56" fill="none" stroke="#334155" strokeWidth="2" />

            {/* Digital pH Meter & Stopwatch Console */}
            <g transform="translate(264, 46)">
              <rect x="0" y="0" width="132" height="148" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
              <text x="66" y="22" textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
                DIGITAL pH METER
              </text>
              <rect x="14" y="32" width="104" height="40" rx="4" fill="#0F172A" />
              <text
                x="108"
                y="58"
                textAnchor="end"
                className="fill-emerald-400 text-[18px] font-mono font-bold"
              >
                pH {state.ph.toFixed(2)}
              </text>

              <text x="66" y="94" textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
                ELAPSED TIME
              </text>
              <rect x="14" y="102" width="104" height="32" rx="4" fill="#F1F5F9" stroke="#CBD5E1" />
              <text
                x="108"
                y="123"
                textAnchor="end"
                className="fill-slate-900 text-[15px] font-mono font-semibold"
              >
                {elapsedSec} s
              </text>
            </g>
          </svg>

          <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Indicator State: </span>
            {state.label}
          </div>
        </div>

        {/* Reaction Controls */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800">2. Start Lipase Milk Decay</h3>
            <p className="text-xs text-slate-500">
              Add 1 cm³ of 5% lipase solution to hydrolyse milk lipids into fatty acids, lowering the pH until Cresol red turns yellow.
            </p>

            <button
              type="button"
              disabled={running}
              onClick={handleAddLipase}
              className="w-full rounded-lg bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-45"
            >
              {running ? 'Reacting… Watching Colour Shift' : 'Add 1 cm³ Lipase & Start Timer'}
            </button>

            <button
              type="button"
              onClick={handleFastForward}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Fast-Forward to Endpoint
            </button>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 font-mono text-xs">
              <div>
                <span className="block text-[10px] text-slate-500">Time to Yellow</span>
                <span className="font-semibold text-slate-900">
                  {canRecord ? (endpointSec !== null ? `${endpointSec} s` : '>240 s') : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Rate (1000 / t)</span>
                <span className="font-semibold text-teal-800">
                  {canRecord ? (endpointSec !== null ? calculateRatePerThousandSec(endpointSec) : '0.00') : '—'}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canRecord}
              onClick={handleRecordResult}
              className="mt-3 w-full rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Record {tempC} °C Trial to Table & Graph
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
