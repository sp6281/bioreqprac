import React, { useState } from 'react';
import {
  ENZYME_PH_VALUES,
  simulateAmylaseDigestTimeSec,
  isStarchPresentAtTime,
  calculateRatePerThousandSec,
} from '../../sim/biologyMath';
import type { BenchProps } from './MicroscopyBench';

export const EnzymesBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [ph, setPh] = useState<number>(7);
  const [seed, setSeed] = useState(1);
  const [endpointSec, setEndpointSec] = useState<number | null>(() => simulateAmylaseDigestTimeSec(7, 1));
  const [testedWells, setTestedWells] = useState<number>(0); // 0 to 12 (each well = 30s)
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectPh = (nextPh: number) => {
    const nextSeed = seed + 1;
    setPh(nextPh);
    setSeed(nextSeed);
    setEndpointSec(simulateAmylaseDigestTimeSec(nextPh, nextSeed));
    setTestedWells(0);
    setFeedback(null);
    onCompleteStep(0);
    onCompleteStep(1);
  };

  const handleSampleNextWell = () => {
    if (testedWells >= 12) return;
    const nextCount = testedWells + 1;
    const currentSec = nextCount * 30;
    setTestedWells(nextCount);
    onCompleteStep(2);
    onCompleteStep(3);

    const starchStillThere = isStarchPresentAtTime(currentSec, endpointSec);
    if (!starchStillThere) {
      onCompleteStep(4);
      setFeedback(
        `Endpoint reached at ${currentSec} s! Iodine stayed orange-brown (all starch digested into maltose).`
      );
    } else if (nextCount === 12) {
      onCompleteStep(4);
      setFeedback(
        `360 s elapsed and starch is still blue-black. Amylase is denatured at pH ${ph}.`
      );
    } else {
      setFeedback(`Sampled at ${currentSec} s: iodine turned blue-black (starch still present). Sample next well.`);
    }
  };

  const handleRunToEndpoint = () => {
    onCompleteStep(2);
    onCompleteStep(3);
    onCompleteStep(4);
    if (endpointSec === null) {
      setTestedWells(12);
      setFeedback(`All 12 wells (360 s) turned blue-black — amylase denatured at pH ${ph}.`);
    } else {
      const wellIndex = Math.min(12, Math.round(endpointSec / 30));
      setTestedWells(wellIndex);
      setFeedback(`Endpoint reached at ${endpointSec} s (well #${wellIndex} stayed orange-brown).`);
    }
  };

  const latestSec = testedWells * 30;
  const reachedClearWell = testedWells > 0 && !isStarchPresentAtTime(latestSec, endpointSec);
  const completedAllDenatured = testedWells === 12 && endpointSec === null;
  const canRecord = reachedClearWell || completedAllDenatured;

  const handleRecordResult = () => {
    if (!canRecord) {
      setFeedback('Keep sampling every 30 s until a well remains orange-brown (or 360 s is reached).');
      return;
    }
    const recordedTime = reachedClearWell ? endpointSec! : 360;
    const rate = reachedClearWell ? calculateRatePerThousandSec(endpointSec) : 0;
    onRecordRow({
      ph,
      tempC: 35,
      timeSec: recordedTime,
      rate,
      status: reachedClearWell ? 'Digested' : 'Denatured (>360 s)',
    });
    onCompleteStep(5);
    setFeedback(`Recorded pH ${ph}: ${reachedClearWell ? `${recordedTime} s (rate ${rate})` : 'Denatured (rate 0)'}.`);
  };

  return (
    <div className="space-y-5">
      {/* pH Buffer Selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Select Buffer pH (Water Bath at 35 °C)</h3>
            <p className="text-xs text-slate-500">
              Equilibrate starch + amylase + pH buffer at 35 °C, then test drops on the iodine spotting tile every 30 s.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-600">Water Bath: 35.0 °C</span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {ENZYME_PH_VALUES.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleSelectPh(val)}
              className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors ${
                ph === val
                  ? 'border-teal-700 bg-teal-700 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              pH {val}
            </button>
          ))}
        </div>
      </div>

      {/* Spotting Tile Stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-800">Porcelain Spotting Tile (12 Iodine Wells)</span>
            <span className="font-mono text-slate-600">Stopwatch: {latestSec} s</span>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
              {Array.from({ length: 12 }).map((_, idx) => {
                const wellSec = (idx + 1) * 30;
                const isTested = idx < testedWells;
                const starchHere = isStarchPresentAtTime(wellSec, endpointSec);
                const bgColor = !isTested
                  ? '#F59E0B' // Fresh unreacted iodine drop (amber)
                  : starchHere
                  ? '#1E1B4B' // Blue-black (starch present)
                  : '#D97706'; // Remains orange-brown (starch digested)

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-200 shadow-inner transition-colors duration-200"
                      style={{ backgroundColor: bgColor }}
                      aria-label={`Well ${idx + 1} at ${wellSec} seconds: ${
                        !isTested ? 'untested iodine' : starchHere ? 'blue-black starch present' : 'orange-brown endpoint'
                      }`}
                    >
                      {isTested && !starchHere && (
                        <span className="text-[10px] font-mono font-bold text-white">END</span>
                      )}
                    </div>
                    <span className="mt-1 font-mono text-[10px] text-slate-600">{wellSec}s</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-[#F59E0B]" /> Untested iodine drop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-[#1E1B4B]" /> Blue-black (starch remains)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-[#D97706]" /> Orange-brown (digestion complete)
            </span>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-800">2. Transfer Sample Drops</h3>
            <p className="text-xs text-slate-500">
              Transfer a drop of reaction mixture onto the next iodine well every 30 seconds until no blue-black colour forms.
            </p>

            <button
              type="button"
              disabled={testedWells >= 12 || reachedClearWell}
              onClick={handleSampleNextWell}
              className="w-full rounded-lg bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Transfer Next 30 s Drop ({(testedWells + 1) * 30} s)
            </button>

            <button
              type="button"
              disabled={canRecord}
              onClick={handleRunToEndpoint}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Auto-Sample to Endpoint
            </button>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 font-mono text-xs">
              <div>
                <span className="block text-[10px] text-slate-500">Time to Digest</span>
                <span className="font-semibold text-slate-900">
                  {reachedClearWell ? `${endpointSec} s` : completedAllDenatured ? '>360 s' : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Rate (1000 / t)</span>
                <span className="font-semibold text-teal-800">
                  {reachedClearWell ? calculateRatePerThousandSec(endpointSec) : completedAllDenatured ? '0.00' : '—'}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canRecord}
              onClick={handleRecordResult}
              className="mt-3 w-full rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Record pH {ph} Result to Graph
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
