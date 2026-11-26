import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  REACTION_CONDITIONS,
  type ReactionConditionId,
  dropDistanceCmToReactionMs,
  reactionMsToDropDistanceCm,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

type DropPhase = 'idle' | 'waiting' | 'falling' | 'caught' | 'missed' | 'early';

export const ReactionTimeBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [conditionId, setConditionId] = useState<ReactionConditionId>('baseline');
  const [phase, setPhase] = useState<DropPhase>('idle');
  const [dropCm, setDropCm] = useState<number>(0);
  const [reactionMs, setReactionMs] = useState<number>(0);
  const [trialCount, setTrialCount] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const waitTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const dropStartRef = useRef<number>(0);

  const condition = REACTION_CONDITIONS[conditionId];

  const cleanupTimers = useCallback(() => {
    if (waitTimerRef.current !== null) {
      window.clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => cleanupTimers, [cleanupTimers]);

  const startDropSequence = () => {
    cleanupTimers();
    setDropCm(0);
    setReactionMs(0);
    setPhase('waiting');
    setFeedback('Wait for the ruler to drop… Press Spacebar or click "Catch Ruler" immediately!');
    onCompleteStep(0);
    onCompleteStep(1);

    // Random unpredictable delay between 1.2 s and 2.8 s
    const delayMs = 1200 + Math.random() * 1600;
    waitTimerRef.current = window.setTimeout(() => {
      dropStartRef.current = performance.now();
      setPhase('falling');
      onCompleteStep(2);

      const animateFall = (now: number) => {
        const elapsed = now - dropStartRef.current;
        const currentCm = reactionMsToDropDistanceCm(elapsed);
        if (currentCm >= 30) {
          setDropCm(30);
          setPhase('missed');
          setFeedback('The 30 cm ruler slipped past your fingers (>247 ms)! Try again or run a simulated trial.');
          return;
        }
        setDropCm(currentCm);
        rafRef.current = window.requestAnimationFrame(animateFall);
      };
      rafRef.current = window.requestAnimationFrame(animateFall);
    }, delayMs);
  };

  const handleCatch = useCallback(() => {
    if (phase === 'waiting') {
      cleanupTimers();
      setPhase('early');
      setFeedback('Caught too early before release! Wait until the ruler actually drops.');
      return;
    }
    if (phase === 'falling') {
      cleanupTimers();
      const rawElapsed = Math.max(90, performance.now() - dropStartRef.current);
      // Apply the controlled factor offset (e.g., caffeine slightly faster, distraction slower)
      const effectiveMs = Math.max(105, Math.min(245, Math.round(rawElapsed + condition.latencyOffsetMs)));
      const effectiveCm = Math.min(30, reactionMsToDropDistanceCm(effectiveMs));
      const verifiedMs = dropDistanceCmToReactionMs(effectiveCm);
      setDropCm(effectiveCm);
      setReactionMs(verifiedMs);
      setPhase('caught');
      onCompleteStep(3);
      setFeedback(`Caught at ${effectiveCm.toFixed(1)} cm → Reaction time: ${verifiedMs} ms.`);
    }
  }, [phase, cleanupTimers, condition.latencyOffsetMs, onCompleteStep]);

  // Spacebar shortcut for realistic keyboard reaction test
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (phase === 'waiting' || phase === 'falling')) {
        e.preventDefault();
        handleCatch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handleCatch]);

  // Deterministic/accessible single-click simulated participant drop (useful if user prefers observing a model participant)
  const handleRunModelParticipant = () => {
    cleanupTimers();
    const baseMs = 205 + condition.latencyOffsetMs + Math.round((Math.random() - 0.5) * 26);
    const clampedMs = Math.max(120, Math.min(245, baseMs));
    const cm = Math.min(29.8, reactionMsToDropDistanceCm(clampedMs));
    const verifiedMs = dropDistanceCmToReactionMs(cm);
    setDropCm(cm);
    setReactionMs(verifiedMs);
    setPhase('caught');
    onCompleteStep(1);
    onCompleteStep(2);
    onCompleteStep(3);
    setFeedback(`Participant caught at ${cm.toFixed(1)} cm → Reaction time: ${verifiedMs} ms.`);
  };

  const handleRecordTrial = () => {
    if (phase !== 'caught') {
      setFeedback('Catch the falling ruler first before recording your trial.');
      return;
    }
    const nextTrial = trialCount + 1;
    setTrialCount(nextTrial);
    onRecordRow({
      condition: condition.label,
      trial: nextTrial,
      dropCm: Number(dropCm.toFixed(1)),
      reactionMs,
    });
    onCompleteStep(4);
    if (nextTrial >= 3) onCompleteStep(5);
    setFeedback(`Recorded Trial #${nextTrial} (${condition.label}): ${dropCm.toFixed(1)} cm (${reactionMs} ms).`);
  };

  // Visual vertical shift of 30 cm ruler (1 cm = 5.6 px)
  const rulerShiftPx = Math.min(30, dropCm) * 5.6;

  return (
    <div className="space-y-5">
      {/* Condition Selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Choose Factor Affecting Reaction Time</h3>
            <p className="text-xs text-slate-500">{condition.description}</p>
          </div>
          <span className="font-mono text-xs text-slate-600">Formula: t = √(2d ÷ 9.81)</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(REACTION_CONDITIONS) as ReactionConditionId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                cleanupTimers();
                setConditionId(id);
                setPhase('idle');
                setDropCm(0);
                setReactionMs(0);
                setFeedback(null);
              }}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                conditionId === id
                  ? 'border-teal-700 bg-teal-700 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {REACTION_CONDITIONS[id].label}
            </button>
          ))}
        </div>
      </div>

      {/* Ruler Drop Stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-2 flex w-full items-center justify-between text-xs">
            <span className="font-medium text-slate-800">30 cm Ruler Drop Rig</span>
            <span className="font-mono text-slate-600">
              {phase === 'idle' && 'Ready at 0.0 cm'}
              {phase === 'waiting' && 'Hold steady…'}
              {phase === 'falling' && 'DROPPING!'}
              {phase === 'caught' && `Caught: ${dropCm.toFixed(1)} cm (${reactionMs} ms)`}
              {phase === 'missed' && 'Missed (>30 cm)'}
              {phase === 'early' && 'False start'}
            </span>
          </div>

          <svg
            viewBox="0 0 360 270"
            className="h-64 w-full max-w-sm select-none"
            role="img"
            aria-label={`Ruler drop apparatus currently at ${dropCm.toFixed(1)} centimetres`}
          >
            {/* Distraction visual rings when Distraction mode is active */}
            {conditionId === 'distraction' && (phase === 'waiting' || phase === 'falling') && (
              <g stroke="#F59E0B" strokeOpacity="0.45" fill="none">
                <circle cx="80" cy="70" r="22" strokeWidth="2" />
                <circle cx="290" cy="110" r="28" strokeWidth="2" />
                <text x="290" y="114" textAnchor="middle" className="fill-amber-700 text-[10px] font-mono">
                  NOISE
                </text>
              </g>
            )}

            {/* Falling 30 cm wooden ruler */}
            <g transform={`translate(162, ${20 + rulerShiftPx - 140})`}>
              <rect x="0" y="0" width="36" height="190" rx="2" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.5" />
              {Array.from({ length: 31 }).map((_, cm) => {
                // 0 cm at bottom (y=180), 30 cm at top (y=12)
                const y = 180 - cm * 5.6;
                const major = cm % 5 === 0;
                return (
                  <g key={cm}>
                    <line x1="0" y1={y} x2={major ? 14 : 7} y2={y} stroke="#78350F" strokeWidth={major ? '1.2' : '0.7'} />
                    {major && (
                      <text x="17" y={y + 3} className="fill-amber-950 text-[8px] font-mono">
                        {cm}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Catching line aligned at 0 cm initial mark (y = 200) */}
            <line x1="95" y1="200" x2="265" y2="200" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="270" y="203" className="fill-teal-800 text-[10px] font-mono font-semibold">
              Catch mark
            </text>

            {/* Thumb & forefinger indicator */}
            <rect x="132" y="191" width="26" height="18" rx="8" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
            <rect x="202" y="191" width="26" height="18" rx="8" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />

            {/* Bench edge */}
            <rect x="20" y="242" width="320" height="22" fill="#CBD5E1" />
          </svg>
        </div>

        {/* Playable Reaction Controls */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800">2. Run Ruler Drop Trial</h3>
            <p className="text-xs text-slate-500">
              Click Ready to Drop, wait for the ruler to fall, then click Catch Ruler (or press Spacebar).
            </p>

            {phase === 'waiting' || phase === 'falling' ? (
              <button
                type="button"
                onClick={handleCatch}
                className={`w-full rounded-lg px-4 py-3.5 text-sm font-bold text-white transition-colors ${
                  phase === 'falling' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {phase === 'falling' ? 'CATCH RULER NOW! (Space)' : 'Wait for Drop… (Do Not Click Early)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={startDropSequence}
                className="w-full rounded-lg bg-slate-900 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Ready to Drop (Interactive Reflex Test)
              </button>
            )}

            <button
              type="button"
              onClick={handleRunModelParticipant}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Simulate Lab Partner Catch ({condition.label})
            </button>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 font-mono text-xs">
              <div>
                <span className="block text-[10px] text-slate-500">Drop Distance (d)</span>
                <span className="font-semibold text-slate-900">
                  {phase === 'caught' ? `${dropCm.toFixed(1)} cm` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Reaction Time (t)</span>
                <span className="font-semibold text-teal-800">
                  {phase === 'caught' ? `${reactionMs} ms` : '—'}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={phase !== 'caught'}
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
