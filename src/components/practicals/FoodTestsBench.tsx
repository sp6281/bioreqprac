import React, { useState } from 'react';
import {
  FOOD_SAMPLES,
  type FoodSampleId,
  type ReagentId,
  evaluateFoodTest,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

const REAGENT_META: Record<ReagentId, { label: string; target: string; initialHex: string }> = {
  iodine: { label: 'Iodine Solution', target: 'Starch', initialHex: '#D97706' },
  benedicts: { label: "Benedict's Solution", target: 'Reducing Sugars', initialHex: '#2563EB' },
  biuret: { label: 'Biuret Reagent', target: 'Proteins', initialHex: '#3B82F6' },
  sudanIII: { label: 'Sudan III Stain', target: 'Lipids', initialHex: '#DC2626' },
};

export const FoodTestsBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [sampleId, setSampleId] = useState<FoodSampleId>('potato');
  const [reagentId, setReagentId] = useState<ReagentId>('iodine');
  const [reagentAdded, setReagentAdded] = useState(false);
  const [heated, setHeated] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sample = FOOD_SAMPLES[sampleId];
  const reagent = REAGENT_META[reagentId];
  const outcome = reagentAdded ? evaluateFoodTest(sampleId, reagentId, heated) : null;

  const handleSelectSample = (id: FoodSampleId) => {
    setSampleId(id);
    setReagentAdded(false);
    setHeated(false);
    setFeedback(null);
    onCompleteStep(0);
  };

  const handleSelectReagent = (id: ReagentId) => {
    setReagentId(id);
    setReagentAdded(false);
    setHeated(false);
    setFeedback(null);
    onCompleteStep(1);
  };

  const handleAddReagent = () => {
    setReagentAdded(true);
    onCompleteStep(2);
    if (reagentId === 'benedicts' && !heated) {
      setFeedback("Benedict's solution added. Activate the 80 °C water bath to test for reducing sugars.");
    } else {
      const res = evaluateFoodTest(sampleId, reagentId, heated);
      onCompleteStep(4);
      setFeedback(`${res.observation} — ${res.conclusion}.`);
    }
  };

  const handleToggleWaterBath = () => {
    const nextHeated = !heated;
    setHeated(nextHeated);
    if (nextHeated) {
      onCompleteStep(3);
      if (reagentAdded) {
        const res = evaluateFoodTest(sampleId, reagentId, true);
        onCompleteStep(4);
        setFeedback(`Heated in 80 °C water bath for 5 min: ${res.observation} (${res.conclusion}).`);
      }
    }
  };

  const handleRecordObservation = () => {
    if (!outcome) {
      setFeedback('Add a reagent to the test tube before recording your observation.');
      return;
    }
    onRecordRow({
      sample: sample.name,
      reagent: reagent.label,
      heated: heated ? 'Yes (80 °C)' : 'No',
      observation: outcome.observation,
      result: outcome.conclusion,
    });
    onCompleteStep(5);
    setFeedback(`Recorded test: ${sample.name} + ${reagent.label} → ${outcome.conclusion}.`);
  };

  const tubeFillHex = outcome ? outcome.tubeColorHex : sample.baseColorHex;

  return (
    <div className="space-y-5">
      {/* Sample & Reagent Selectors */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-800">1. Choose Food Sample</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(FOOD_SAMPLES) as FoodSampleId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectSample(id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    sampleId === id
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {FOOD_SAMPLES[id].name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-800">2. Choose Qualitative Reagent</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(REAGENT_META) as ReagentId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectReagent(id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    reagentId === id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block">{REAGENT_META[id].label}</span>
                  <span className={`text-[10px] ${reagentId === id ? 'text-slate-300' : 'text-slate-500'}`}>
                    Tests: {REAGENT_META[id].target}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Boiling Tube & Water Bath Stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-2 flex w-full items-center justify-between text-xs text-slate-600">
            <span className="font-medium text-slate-800">
              {sample.name} + {reagentAdded ? reagent.label : 'No reagent yet'}
            </span>
            <span className="font-mono">{heated ? '80 °C Water Bath ON' : 'Room Temp (20 °C)'}</span>
          </div>

          <svg
            viewBox="0 0 360 250"
            className="h-60 w-full max-w-sm select-none"
            role="img"
            aria-label={`Test tube containing ${sample.name} showing ${outcome ? outcome.observation : 'untreated sample'}`}
          >
            {/* Water bath beaker if heated */}
            {heated && (
              <g>
                <rect x="92" y="106" width="176" height="122" rx="6" fill="#DBEAFE" fillOpacity="0.45" stroke="#3B82F6" strokeWidth="1.5" />
                <text x="180" y="218" textAnchor="middle" className="fill-blue-800 text-[10px] font-mono font-semibold">
                  80 °C Water Bath
                </text>
                {/* Gentle heat waves */}
                <path d="M 118 96 Q 124 88 118 80" fill="none" stroke="#94A3B8" strokeWidth="1.4" />
                <path d="M 242 96 Q 248 88 242 80" fill="none" stroke="#94A3B8" strokeWidth="1.4" />
              </g>
            )}

            {/* Pipette dropper hovering above tube */}
            <g transform="translate(166, 8)">
              <rect x="7" y="0" width="14" height="16" rx="5" fill="#475569" />
              <path d="M 9 16 L 19 16 L 16 44 L 12 44 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.2" />
              <circle cx="14" cy="49" r="3" fill={reagent.initialHex} />
            </g>

            {/* Glass Test Tube */}
            <path
              d="M 148 58 L 148 184 A 32 32 0 0 0 212 184 L 212 58 Z"
              fill="#FFFFFF"
              fillOpacity="0.85"
              stroke="#64748B"
              strokeWidth="2.2"
            />

            {/* Liquid body */}
            <path
              d="M 150 116 L 150 183 A 30 30 0 0 0 210 183 L 210 116 Z"
              fill={tubeFillHex}
            />
            <ellipse cx="180" cy="116" rx="30" ry="4" fill={outcome?.topLayerHex ?? tubeFillHex} fillOpacity="0.92" />

            {/* Sudan III distinct red top lipid layer */}
            {outcome?.topLayerHex && (
              <rect x="150" y="106" width="60" height="12" fill={outcome.topLayerHex} />
            )}

            {/* Glass specular highlight */}
            <line x1="158" y1="68" x2="158" y2="180" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.55" strokeLinecap="round" />

            {/* Bench line */}
            <line x1="24" y1="228" x2="336" y2="228" stroke="#CBD5E1" strokeWidth="2" />
          </svg>

          {outcome && (
            <div
              className={`mt-2 w-full rounded-md border px-3 py-2 text-xs ${
                outcome.positive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : outcome.requiresHeatWarning
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <span className="font-semibold">
                {outcome.positive ? '● Positive Result: ' : outcome.requiresHeatWarning ? '▲ Action Needed: ' : '○ Negative Result: '}
              </span>
              {outcome.observation} — {outcome.conclusion}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800">3. Perform Chemical Test</h3>

            <button
              type="button"
              onClick={handleAddReagent}
              className="w-full rounded-lg bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {reagentAdded ? `✓ Added ${reagent.label}` : `Add ${reagent.label} with Pipette`}
            </button>

            <button
              type="button"
              onClick={handleToggleWaterBath}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-xs font-medium transition-colors ${
                heated
                  ? 'border-amber-600 bg-amber-50 text-amber-900'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {heated ? '✓ In 80 °C Water Bath (5 min)' : 'Place in 80 °C Water Bath'}
            </button>

            <div className="rounded-md bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">AQA Colour Key:</span>
              <ul className="mt-1 space-y-1">
                <li>Iodine: Orange-brown → Blue-black (Starch)</li>
                <li>Benedict&apos;s + Heat: Blue → Green / Yellow / Brick-red (Reducing sugar)</li>
                <li>Biuret: Pale blue → Lilac / Purple (Protein)</li>
                <li>Sudan III: Red stained top layer (Lipids)</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={!reagentAdded}
              onClick={handleRecordObservation}
              className="w-full rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Record Observation to Table
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
