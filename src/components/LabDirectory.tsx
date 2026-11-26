import React, { useState } from 'react';
import { ArrowRight, Microscope } from 'lucide-react';
import { PRACTICALS } from '../data/practicals';
import type { LabNotebookState, PracticalId } from '../types/lab';
import { countCompletedPracticals, practicalProgressPercent, totalRecordedTrials } from '../utils/storage';

type DirectoryFilter = 'all' | 'Paper 1' | 'Paper 2' | 'Combined & Biology' | 'Biology Only';

interface LabDirectoryProps {
  notebook: LabNotebookState;
  activeFilter: DirectoryFilter;
  onFilterChange: (filter: DirectoryFilter) => void;
  onOpenPractical: (id: PracticalId) => void;
}

const HERO_IMAGE_PATH = '/src/assets/images/biolab_workbench_hero_1795698465042.jpg';

export const LabDirectory: React.FC<LabDirectoryProps> = ({
  notebook,
  activeFilter,
  onFilterChange,
  onOpenPractical,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const filtered = PRACTICALS.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'Paper 1' || activeFilter === 'Paper 2') return p.paper === activeFilter;
    return p.tier === activeFilter;
  });

  const completedCount = countCompletedPracticals(notebook);
  const trialsTotal = totalRecordedTrials(notebook);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero 2-Column Split (items-stretch per layout architecture) */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between space-y-6 lg:col-span-6 lg:py-2">
          <div className="space-y-4">
            <p className="text-xs font-medium text-teal-800">
              AQA GCSE Biology (8461) · Combined Science & Separate Biology
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
              Complete all ten required biology practicals safely online
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-slate-600">
              Practise real laboratory techniques — from focusing stained onion cells and timing
              amylase digestion to measuring zones of inhibition and sampling meadow transects —
              while recording observations and plotting live graphs in your digital lab notebook.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => onOpenPractical('rp3')}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800"
            >
              Start Osmosis Practical
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onOpenPractical('rp1')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 whitespace-nowrap transition-colors hover:bg-slate-50"
            >
              Open Microscopy Bench
            </button>
          </div>
        </div>

        {/* Hero Laboratory Photograph with resilient fallback */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-6">
          {!imgFailed ? (
            <img
              src={HERO_IMAGE_PATH}
              alt="Biology teaching laboratory benchtop with light microscope, boiling tubes of reagent solutions, petri dishes, and Elodea pondweed"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-64 w-full object-cover lg:h-full"
            />
          ) : (
            <div className="flex h-64 w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-teal-50 p-6 text-center lg:h-full">
              <Microscope className="h-10 w-10 text-teal-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-800">AQA GCSE Biology Laboratory</p>
              <p className="mt-1 text-xs text-slate-500">10 Interactive Apparatus Benches</p>
            </div>
          )}
        </div>
      </section>

      {/* Full-width 4-Column Quantitative Strip below Hero Split */}
      <section
        aria-label="Laboratory summary statistics"
        className="mt-8 grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0"
      >
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">Required Practicals</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">10</p>
          <p className="mt-0.5 text-[11px] text-slate-500">7 Combined · 3 Biology Only</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">Practicals Completed</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-teal-800">
            {completedCount} / 10
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Saved locally in browser</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">Trials Recorded</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {trialsTotal}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Exportable to CSV report</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">AQA Specification</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">8461</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Paper 1 & Paper 2 coverage</p>
        </div>
      </section>

      {/* Practicals Directory & Segmented Filter Controls */}
      <section className="mt-10" id="practicals-directory">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Required Practicals Directory
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Select a practical to launch its interactive apparatus bench, safety briefing, and results table.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
            role="tablist"
            aria-label="Filter required practicals"
          >
            {(
              [
                { id: 'all', label: 'All (10)' },
                { id: 'Paper 1', label: 'Paper 1' },
                { id: 'Paper 2', label: 'Paper 2' },
                { id: 'Combined & Biology', label: 'Combined Science' },
                { id: 'Biology Only', label: 'Biology Only' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clean 2-Column Practical Cards Grid (Zero-Pill Metadata) */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((p) => {
            const entry = notebook[p.id];
            const pct = practicalProgressPercent(p, entry);
            return (
              <article
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-600/60"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-medium text-teal-800">{p.paper}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.tier}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Spec {p.specRef}</span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900">
                    {String(p.number).padStart(2, '0')}. {p.shortTitle} — {p.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{p.subtitle}</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                      <span>{entry.rows.length} / {p.targetTrials} trials</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-teal-600 transition-all duration-200"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPractical(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 whitespace-nowrap transition-colors hover:border-teal-700 hover:bg-teal-700 hover:text-white"
                  >
                    Open Bench
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
