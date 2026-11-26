import React, { useState } from 'react';
import { ArrowRight, Download, Printer, RotateCcw } from 'lucide-react';
import { PRACTICALS } from '../data/practicals';
import type { LabNotebookState, PracticalId } from '../types/lab';
import {
  countCompletedPracticals,
  exportPracticalToCsv,
  practicalProgressPercent,
  totalRecordedTrials,
  triggerCsvDownload,
} from '../utils/storage';
import { ScientificGraph } from './ScientificGraph';

interface LabNotebookViewProps {
  notebook: LabNotebookState;
  onOpenPractical: (id: PracticalId) => void;
  onResetAll: () => void;
}

export const LabNotebookView: React.FC<LabNotebookViewProps> = ({
  notebook,
  onOpenPractical,
  onResetAll,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const completedCount = countCompletedPracticals(notebook);
  const totalTrials = totalRecordedTrials(notebook);

  const practicalsWithData = PRACTICALS.filter(
    (p) => notebook[p.id].rows.length > 0 || notebook[p.id].conclusion.trim().length > 0
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-teal-800">Digital Practical Logbook</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Student Lab Notebook
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review all recorded observations, experimental tables, live graphs, and written conclusions across all 10 practicals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print Report
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 whitespace-nowrap hover:border-rose-300 hover:text-rose-700"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Notebook
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs">
              <span className="font-medium text-rose-800">Erase all data?</span>
              <button
                type="button"
                onClick={() => {
                  onResetAll();
                  setConfirmReset(false);
                }}
                className="font-semibold text-rose-700 underline"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-slate-600 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Progress Summary */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Practicals with Data</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {practicalsWithData.length} / 10
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Practicals Reaching Target Trials</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-teal-800">
            {completedCount} / 10
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Recorded Trials</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {totalTrials}
          </p>
        </div>
      </div>

      {/* Practical Entries */}
      {practicalsWithData.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-base font-semibold text-slate-900">No experimental data recorded yet</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
            Open any practical bench to run experiments, record measurements, and automatically populate your lab notebook.
          </p>
          <button
            type="button"
            onClick={() => onOpenPractical('rp3')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Start RP3 Osmosis Practical
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {practicalsWithData.map((p) => {
            const entry = notebook[p.id];
            const pct = practicalProgressPercent(p, entry);
            return (
              <section key={p.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      {p.paper} · {p.tier} · Spec {p.specRef} · {pct}% complete
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {String(p.number).padStart(2, '0')}. {p.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    <button
                      type="button"
                      onClick={() => {
                        const csv = exportPracticalToCsv(p, entry);
                        triggerCsvDownload(`biolab-aqa-rp${p.number}.csv`, csv);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPractical(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                    >
                      Resume Bench
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className={p.graph ? 'lg:col-span-7' : 'lg:col-span-12'}>
                    {entry.rows.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                              {p.columns.map((c) => (
                                <th key={c.key} className="px-3 py-2 whitespace-nowrap">
                                  {c.label}
                                  {c.unit ? ` (${c.unit})` : ''}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {entry.rows.map((r) => (
                              <tr key={r.id} className={r.anomaly ? 'bg-amber-50 text-slate-500 line-through' : ''}>
                                {p.columns.map((c) => (
                                  <td
                                    key={c.key}
                                    className={`px-3 py-2 ${c.numeric ? 'font-mono tabular-nums' : ''}`}
                                  >
                                    {String(r.values[c.key] ?? '—')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(entry.conclusion.trim() || entry.evaluation.trim()) && (
                      <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3.5 text-xs">
                        {entry.conclusion.trim() && (
                          <div>
                            <span className="font-semibold text-slate-800">Conclusion: </span>
                            <span className="text-slate-700">{entry.conclusion}</span>
                          </div>
                        )}
                        {entry.evaluation.trim() && (
                          <div>
                            <span className="font-semibold text-slate-800">Evaluation: </span>
                            <span className="text-slate-700">{entry.evaluation}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {p.graph && entry.rows.length > 0 && (
                    <div className="lg:col-span-5">
                      <ScientificGraph config={p.graph} rows={entry.rows} title={`${p.shortTitle} Plot`} />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
