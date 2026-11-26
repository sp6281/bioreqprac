import { PRACTICALS } from '../data/practicals';
import type { LabNotebookState, PracticalDefinition, PracticalId, PracticalNotebookEntry } from '../types/lab';

const STORAGE_KEY = 'biolab_aqa_notebook_v1';

export function createEmptyEntry(): PracticalNotebookEntry {
  return {
    rows: [],
    completedSteps: [],
    conclusion: '',
    evaluation: '',
  };
}

export function createInitialNotebook(): LabNotebookState {
  const state = {} as LabNotebookState;
  for (const p of PRACTICALS) {
    state[p.id] = createEmptyEntry();
  }
  return state;
}

export function loadNotebook(): LabNotebookState {
  const fallback = createInitialNotebook();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LabNotebookState>;
    for (const p of PRACTICALS) {
      if (parsed[p.id]) {
        fallback[p.id] = {
          rows: Array.isArray(parsed[p.id]!.rows) ? parsed[p.id]!.rows : [],
          completedSteps: Array.isArray(parsed[p.id]!.completedSteps)
            ? parsed[p.id]!.completedSteps
            : [],
          conclusion: typeof parsed[p.id]!.conclusion === 'string' ? parsed[p.id]!.conclusion : '',
          evaluation: typeof parsed[p.id]!.evaluation === 'string' ? parsed[p.id]!.evaluation : '',
          lastUpdated: parsed[p.id]!.lastUpdated,
        };
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function saveNotebook(notebook: LabNotebookState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notebook));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function practicalProgressPercent(
  practical: PracticalDefinition,
  entry: PracticalNotebookEntry
): number {
  const stepRatio = Math.min(1, entry.completedSteps.length / practical.steps.length);
  const trialRatio = Math.min(1, entry.rows.length / practical.targetTrials);
  const conclusionBonus = entry.conclusion.trim().length >= 15 ? 1 : 0;
  return Math.round((stepRatio * 0.35 + trialRatio * 0.5 + conclusionBonus * 0.15) * 100);
}

export function exportPracticalToCsv(
  practical: PracticalDefinition,
  entry: PracticalNotebookEntry
): string {
  const headers = [
    ...practical.columns.map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label)),
    'Anomaly',
    'Timestamp',
  ];

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of entry.rows) {
    const cols = practical.columns.map((c) => escapeCsv(row.values[c.key] ?? ''));
    cols.push(row.anomaly ? 'Yes' : 'No');
    cols.push(escapeCsv(row.timestamp));
    lines.push(cols.join(','));
  }

  if (entry.conclusion.trim()) {
    lines.push('');
    lines.push(`Conclusion,${escapeCsv(entry.conclusion.trim())}`);
  }
  if (entry.evaluation.trim()) {
    lines.push(`Evaluation,${escapeCsv(entry.evaluation.trim())}`);
  }

  return lines.join('\n');
}

export function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function countCompletedPracticals(notebook: LabNotebookState): number {
  return PRACTICALS.filter((p) => notebook[p.id].rows.length >= Math.min(3, p.targetTrials)).length;
}

export function totalRecordedTrials(notebook: LabNotebookState): number {
  return (Object.keys(notebook) as PracticalId[]).reduce(
    (sum, id) => sum + notebook[id].rows.length,
    0
  );
}
