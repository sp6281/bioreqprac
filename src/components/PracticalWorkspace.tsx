import React, { useState } from 'react';
import { ArrowLeft, CheckSquare, Download, FileText, FlaskConical, ShieldAlert, Square, Trash2 } from 'lucide-react';
import { PRACTICALS, PRACTICAL_MAP } from '../data/practicals';
import type { PracticalId, PracticalNotebookEntry } from '../types/lab';
import { exportPracticalToCsv, practicalProgressPercent, triggerCsvDownload } from '../utils/storage';
import { ScientificGraph } from './ScientificGraph';
import { MicroscopyBench } from './practicals/MicroscopyBench';
import { MicrobiologyBench } from './practicals/MicrobiologyBench';
import { OsmosisBench } from './practicals/OsmosisBench';
import { FoodTestsBench } from './practicals/FoodTestsBench';
import { EnzymesBench } from './practicals/EnzymesBench';
import { PhotosynthesisBench } from './practicals/PhotosynthesisBench';
import { ReactionTimeBench } from './practicals/ReactionTimeBench';
import { PlantResponsesBench } from './practicals/PlantResponsesBench';
import { FieldInvestigationsBench } from './practicals/FieldInvestigationsBench';
import { DecayBench } from './practicals/DecayBench';

type CompanionTab = 'data' | 'method' | 'safety' | 'conclusion';

interface PracticalWorkspaceProps {
  practicalId: PracticalId;
  entry: PracticalNotebookEntry;
  onSelectPractical: (id: PracticalId) => void;
  onBackToDirectory: () => void;
  onRecordRow: (practicalId: PracticalId, values: Record<string, string | number>) => void;
  onDeleteRow: (practicalId: PracticalId, rowId: string) => void;
  onToggleAnomaly: (practicalId: PracticalId, rowId: string) => void;
  onToggleStep: (practicalId: PracticalId, stepIndex: number, forceComplete?: boolean) => void;
  onUpdateNotes: (practicalId: PracticalId, field: 'conclusion' | 'evaluation', value: string) => void;
}

export const PracticalWorkspace: React.FC<PracticalWorkspaceProps> = ({
  practicalId,
  entry,
  onSelectPractical,
  onBackToDirectory,
  onRecordRow,
  onDeleteRow,
  onToggleAnomaly,
  onToggleStep,
  onUpdateNotes,
}) => {
  const [activeTab, setActiveTab] = useState<CompanionTab>('data');
  const practical = PRACTICAL_MAP[practicalId];
  const progressPct = practicalProgressPercent(practical, entry);

  const handleRecord = (values: Record<string, string | number>) => {
    onRecordRow(practicalId, values);
    setActiveTab('data');
  };

  const handleCompleteStep = (stepIndex: number) => {
    onToggleStep(practicalId, stepIndex, true);
  };

  const handleExportCsv = () => {
    const csv = exportPracticalToCsv(practical, entry);
    triggerCsvDownload(`biolab-aqa-rp${practical.number}-${practical.shortTitle.toLowerCase().replace(/\s+/g, '-')}.csv`, csv);
  };

  const renderBench = () => {
    const commonProps = {
      onRecordRow: handleRecord,
      onCompleteStep: handleCompleteStep,
    };
    switch (practicalId) {
      case 'rp1':
        return <MicroscopyBench {...commonProps} />;
      case 'rp2':
        return <MicrobiologyBench {...commonProps} />;
      case 'rp3':
        return <OsmosisBench {...commonProps} />;
      case 'rp4':
        return <FoodTestsBench {...commonProps} />;
      case 'rp5':
        return <EnzymesBench {...commonProps} />;
      case 'rp6':
        return <PhotosynthesisBench {...commonProps} />;
      case 'rp7':
        return <ReactionTimeBench {...commonProps} />;
      case 'rp8':
        return <PlantResponsesBench {...commonProps} />;
      case 'rp9':
        return <FieldInvestigationsBench {...commonProps} />;
      case 'rp10':
        return <DecayBench {...commonProps} />;
    }
  };

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Practical Ribbon */}
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <button
              type="button"
              onClick={onBackToDirectory}
              className="inline-flex items-center gap-1.5 font-medium text-teal-800 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              All Practicals
            </button>
            <span aria-hidden="true">·</span>
            <span>Required Practical {practical.number}</span>
            <span aria-hidden="true">·</span>
            <span>{practical.paper}</span>
            <span aria-hidden="true">·</span>
            <span>{practical.tier}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">AQA {practical.specRef}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {String(practical.number).padStart(2, '0')}. {practical.title}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">{practical.aim}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor="switch-practical" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Switch Practical:
            </label>
            <select
              id="switch-practical"
              value={practicalId}
              onChange={(e) => onSelectPractical(e.target.value as PracticalId)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              {PRACTICALS.map((p) => (
                <option key={p.id} value={p.id}>
                  RP{p.number}. {p.shortTitle}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={entry.rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Two-Zone Laboratory Workspace */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left / Primary Zone: Interactive Lab Bench (7 columns) */}
        <section className="space-y-4 xl:col-span-7" aria-label="Interactive laboratory apparatus">
          {renderBench()}

          {practical.keyEquation && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs">
              <span className="font-semibold text-slate-700">Key Equation / Principle</span>
              <span className="font-mono text-slate-900">{practical.keyEquation}</span>
            </div>
          )}
        </section>

        {/* Right / Companion Zone: Live Results, Graph, Method, Safety, Conclusion (5 columns) */}
        <aside className="flex flex-col rounded-lg border border-slate-200 bg-white xl:col-span-5" aria-label="Lab notebook and method companion">
          {/* Progress header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Lab Companion</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{entry.rows.length} trials</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{progressPct}% complete</span>
            </div>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-teal-600 transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Segmented Companion Tabs */}
          <div className="border-b border-slate-200 bg-slate-50 p-1.5">
            <div className="grid grid-cols-4 gap-1" role="tablist" aria-label="Lab companion sections">
              {(
                [
                  { id: 'data', label: `Data (${entry.rows.length})`, icon: FlaskConical },
                  { id: 'method', label: 'Method', icon: CheckSquare },
                  { id: 'safety', label: 'Safety', icon: ShieldAlert },
                  { id: 'conclusion', label: 'Analysis', icon: FileText },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Panel Content */}
          <div className="flex-1 space-y-4 p-4">
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Recorded Experimental Data</h2>
                  <span className="font-mono text-[11px] text-slate-500">
                    Target: {practical.targetTrials}+ readings
                  </span>
                </div>

                {entry.rows.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                    <p className="text-sm font-medium text-slate-700">Results table is empty</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Run a trial on the apparatus bench and click Record to log your first observation here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                          {practical.columns.map((col) => (
                            <th key={col.key} className="px-2 py-2 align-bottom leading-tight">
                              <span className="block">{col.label}</span>
                              {col.unit ? (
                                <span className="font-mono text-[10px] font-normal text-slate-400">
                                  ({col.unit})
                                </span>
                              ) : null}
                            </th>
                          ))}
                          <th className="px-1.5 py-2 text-right align-bottom whitespace-nowrap">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entry.rows.map((row, idx) => (
                          <tr
                            key={row.id}
                            className={row.anomaly ? 'bg-amber-50/70 text-slate-500 line-through' : 'bg-white text-slate-800'}
                          >
                            {practical.columns.map((col) => {
                              const raw = row.values[col.key];
                              let display = String(raw ?? '—');
                              if (col.numeric && typeof raw === 'number') {
                                if (col.key === 'initialMass' || col.key === 'finalMass' || col.key === 'massChange' || col.key === 'finalPh') {
                                  display = raw.toFixed(2);
                                } else if (col.key === 'concentration' || col.key === 'percentChange' || col.key === 'dropCm') {
                                  display = raw.toFixed(1);
                                }
                              }
                              return (
                                <td
                                  key={col.key}
                                  className={`px-2 py-2 ${col.numeric ? 'font-mono tabular-nums font-medium whitespace-nowrap' : 'leading-snug'}`}
                                >
                                  {display}
                                </td>
                              );
                            })}
                            <td className="px-1.5 py-2 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => onToggleAnomaly(practicalId, row.id)}
                                title={row.anomaly ? 'Restore reading' : 'Flag as anomaly'}
                                aria-label={`Mark row ${idx + 1} as ${row.anomaly ? 'valid' : 'anomaly'}`}
                                className="mr-1 rounded px-1 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
                              >
                                {row.anomaly ? 'Undo' : 'Flag'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRow(practicalId, row.id)}
                                title="Delete row"
                                aria-label={`Delete row ${idx + 1}`}
                                className="inline-flex items-center rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {practical.graph && (
                  <ScientificGraph
                    config={practical.graph}
                    rows={entry.rows}
                    title={`Live Graph: ${practical.shortTitle}`}
                  />
                )}
              </div>
            )}

            {activeTab === 'method' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Guided Laboratory Method</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Steps check off automatically as you operate the bench, or tick them off manually.
                  </p>
                </div>

                <ol className="space-y-2">
                  {practical.steps.map((step, idx) => {
                    const done = entry.completedSteps.includes(idx);
                    return (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => onToggleStep(practicalId, idx)}
                          className={`flex w-full items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition-colors ${
                            done
                              ? 'border-teal-200 bg-teal-50/50 text-slate-700'
                              : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {done ? (
                            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
                          ) : (
                            <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                          )}
                          <span>
                            <span className="mr-1.5 font-mono font-semibold text-slate-500">
                              {idx + 1}.
                            </span>
                            {step}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <div className="border-t border-slate-200 pt-3">
                  <h3 className="text-xs font-semibold text-slate-800">Apparatus List</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                    {practical.apparatus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Variables & Experimental Design</h2>
                  <dl className="mt-2.5 space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div>
                      <dt className="font-semibold text-slate-800">Independent Variable (Changed)</dt>
                      <dd className="mt-0.5 text-slate-600">{practical.independentVar}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">Dependent Variable (Measured)</dt>
                      <dd className="mt-0.5 text-slate-600">{practical.dependentVar}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">Control Variables (Kept Constant)</dt>
                      <dd className="mt-0.5 text-slate-600">
                        <ul className="list-disc space-y-0.5 pl-4">
                          {practical.controlVars.map((cv) => (
                            <li key={cv}>{cv}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Risk Assessment & Lab Safety</h2>
                  <div className="mt-2.5 space-y-2.5">
                    {practical.safety.map((s) => (
                      <div key={s.hazard} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                        <p className="font-semibold text-slate-900">Hazard: {s.hazard}</p>
                        <p className="mt-1 text-slate-600">
                          <span className="font-medium text-amber-800">Risk:</span> {s.risk}
                        </p>
                        <p className="mt-1 text-slate-700">
                          <span className="font-medium text-teal-800">Precaution:</span> {s.precaution}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'conclusion' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="student-conclusion" className="block text-sm font-semibold text-slate-900">
                    Scientific Conclusion
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Describe the trend in your recorded data and explain the underlying biology. Saved automatically.
                  </p>
                  <textarea
                    id="student-conclusion"
                    rows={5}
                    value={entry.conclusion}
                    onChange={(e) => onUpdateNotes(practicalId, 'conclusion', e.target.value)}
                    placeholder={`Explain what your ${practical.shortTitle.toLowerCase()} results show using data values from your table...`}
                    className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-xs leading-relaxed text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="student-evaluation" className="block text-sm font-semibold text-slate-900">
                    Evaluation & Sources of Error
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Note any anomalies, limitations in resolution, or improvements to increase accuracy.
                  </p>
                  <textarea
                    id="student-evaluation"
                    rows={4}
                    value={entry.evaluation}
                    onChange={(e) => onUpdateNotes(practicalId, 'evaluation', e.target.value)}
                    placeholder="Identify sources of systematic or random error and suggest how to improve validity..."
                    className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-xs leading-relaxed text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
