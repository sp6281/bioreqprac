/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { PRACTICAL_MAP } from './data/practicals';
import type { AppView, LabNotebookState, PracticalId } from './types/lab';
import { createInitialNotebook, loadNotebook, saveNotebook } from './utils/storage';
import { LabDirectory } from './components/LabDirectory';
import { PracticalWorkspace } from './components/PracticalWorkspace';
import { LabNotebookView } from './components/LabNotebookView';
import { SkillsSafetyView } from './components/SkillsSafetyView';

type DirectoryFilter = 'all' | 'Paper 1' | 'Paper 2' | 'Combined & Biology' | 'Biology Only';

function getInitialRoute(): { view: AppView; practicalId: PracticalId } {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('practical') as PracticalId | null;
  if (p && PRACTICAL_MAP[p]) {
    return { view: 'bench', practicalId: p };
  }
  if (params.get('autostart') === '1') {
    return { view: 'bench', practicalId: 'rp3' };
  }
  return { view: 'directory', practicalId: 'rp1' };
}

export default function App() {
  const initial = getInitialRoute();
  const [view, setView] = useState<AppView>(initial.view);
  const [activePractical, setActivePractical] = useState<PracticalId>(initial.practicalId);
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>('all');
  const [notebook, setNotebook] = useState<LabNotebookState>(() => loadNotebook());

  useEffect(() => {
    saveNotebook(notebook);
  }, [notebook]);

  const handleOpenPractical = (id: PracticalId) => {
    setActivePractical(id);
    setView('bench');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordRow = (practicalId: PracticalId, values: Record<string, string | number>) => {
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const rowId = `${practicalId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setNotebook((prev) => ({
      ...prev,
      [practicalId]: {
        ...prev[practicalId],
        rows: [...prev[practicalId].rows, { id: rowId, timestamp: ts, values }],
        lastUpdated: now.toISOString(),
      },
    }));
  };

  const handleDeleteRow = (practicalId: PracticalId, rowId: string) => {
    setNotebook((prev) => ({
      ...prev,
      [practicalId]: {
        ...prev[practicalId],
        rows: prev[practicalId].rows.filter((r) => r.id !== rowId),
      },
    }));
  };

  const handleToggleAnomaly = (practicalId: PracticalId, rowId: string) => {
    setNotebook((prev) => ({
      ...prev,
      [practicalId]: {
        ...prev[practicalId],
        rows: prev[practicalId].rows.map((r) =>
          r.id === rowId ? { ...r, anomaly: !r.anomaly } : r
        ),
      },
    }));
  };

  const handleToggleStep = (practicalId: PracticalId, stepIndex: number, forceComplete = false) => {
    setNotebook((prev) => {
      const current = prev[practicalId].completedSteps;
      const exists = current.includes(stepIndex);
      if (forceComplete && exists) return prev;
      const nextSteps = exists
        ? current.filter((i) => i !== stepIndex)
        : [...current, stepIndex].sort((a, b) => a - b);
      return {
        ...prev,
        [practicalId]: {
          ...prev[practicalId],
          completedSteps: nextSteps,
        },
      };
    });
  };

  const handleUpdateNotes = (
    practicalId: PracticalId,
    field: 'conclusion' | 'evaluation',
    value: string
  ) => {
    setNotebook((prev) => ({
      ...prev,
      [practicalId]: {
        ...prev[practicalId],
        [field]: value,
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const handleResetAll = () => {
    setNotebook(createInitialNotebook());
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 — Brand wordmark | 4 concise links | 1 primary CTA */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-[1380px] items-center justify-between gap-8 px-4 sm:px-6 md:h-16 lg:px-8">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => {
              setDirectoryFilter('all');
              setView('directory');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-teal-800"
          >
            BioLab AQA
          </button>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"
          >
            <button
              type="button"
              onClick={() => {
                setDirectoryFilter('all');
                setView('directory');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                view === 'directory' && directoryFilter === 'all'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Practicals
            </button>
            <button
              type="button"
              onClick={() => {
                setDirectoryFilter('Paper 1');
                setView('directory');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                view === 'directory' && directoryFilter === 'Paper 1'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Paper 1
            </button>
            <button
              type="button"
              onClick={() => {
                setDirectoryFilter('Paper 2');
                setView('directory');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                view === 'directory' && directoryFilter === 'Paper 2'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Paper 2
            </button>
            <button
              type="button"
              onClick={() => setView('notebook')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                view === 'notebook'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Lab Notebook
            </button>
            <button
              type="button"
              onClick={() => setView('skills')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                view === 'skills'
                  ? 'text-teal-800 underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              Skills & Safety
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setView(view === 'bench' ? 'notebook' : 'bench')}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-teal-800"
            >
              {view === 'bench' ? 'View Notebook' : 'Open Bench'}
            </button>
          </div>
        </div>

        {/* Compact mobile navigation row (only shown below md breakpoint) */}
        <nav
          aria-label="Mobile navigation"
          className="flex items-center gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 text-xs font-medium text-slate-600 md:hidden"
        >
          <button
            type="button"
            onClick={() => {
              setDirectoryFilter('all');
              setView('directory');
            }}
            className={`whitespace-nowrap shrink-0 ${view === 'directory' ? 'text-teal-800 font-semibold' : ''}`}
          >
            Practicals
          </button>
          <button
            type="button"
            onClick={() => setView('bench')}
            className={`whitespace-nowrap shrink-0 ${view === 'bench' ? 'text-teal-800 font-semibold' : ''}`}
          >
            Lab Bench
          </button>
          <button
            type="button"
            onClick={() => setView('notebook')}
            className={`whitespace-nowrap shrink-0 ${view === 'notebook' ? 'text-teal-800 font-semibold' : ''}`}
          >
            Lab Notebook
          </button>
          <button
            type="button"
            onClick={() => setView('skills')}
            className={`whitespace-nowrap shrink-0 ${view === 'skills' ? 'text-teal-800 font-semibold' : ''}`}
          >
            Skills & Safety
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {view === 'directory' && (
          <LabDirectory
            notebook={notebook}
            activeFilter={directoryFilter}
            onFilterChange={setDirectoryFilter}
            onOpenPractical={handleOpenPractical}
          />
        )}

        {view === 'bench' && (
          <PracticalWorkspace
            practicalId={activePractical}
            entry={notebook[activePractical]}
            onSelectPractical={handleOpenPractical}
            onBackToDirectory={() => setView('directory')}
            onRecordRow={handleRecordRow}
            onDeleteRow={handleDeleteRow}
            onToggleAnomaly={handleToggleAnomaly}
            onToggleStep={handleToggleStep}
            onUpdateNotes={handleUpdateNotes}
          />
        )}

        {view === 'notebook' && (
          <LabNotebookView
            notebook={notebook}
            onOpenPractical={handleOpenPractical}
            onResetAll={handleResetAll}
          />
        )}

        {view === 'skills' && <SkillsSafetyView />}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 no-print">
        <div className="mx-auto flex max-w-[1380px] flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>BioLab AQA · Virtual GCSE Biology Practical Environment (Specification 8461)</p>
          <p>All student observations and experimental data are saved automatically on this device.</p>
        </div>
      </footer>
    </div>
  );
}
