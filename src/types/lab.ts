export type PracticalId =
  | 'rp1'
  | 'rp2'
  | 'rp3'
  | 'rp4'
  | 'rp5'
  | 'rp6'
  | 'rp7'
  | 'rp8'
  | 'rp9'
  | 'rp10';

export type PaperCategory = 'Paper 1' | 'Paper 2';
export type CourseTier = 'Combined & Biology' | 'Biology Only';

export interface SafetyItem {
  hazard: string;
  risk: string;
  precaution: string;
}

export interface ColumnSchema {
  key: string;
  label: string;
  unit?: string;
  numeric?: boolean;
}

export interface GraphConfig {
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
  chartType: 'scatter-line' | 'bar';
  showZeroLine?: boolean;
  showIsotonicIntercept?: boolean;
}

export interface PracticalDefinition {
  id: PracticalId;
  number: number;
  shortTitle: string;
  title: string;
  subtitle: string;
  paper: PaperCategory;
  tier: CourseTier;
  specRef: string;
  topic: string;
  aim: string;
  independentVar: string;
  dependentVar: string;
  controlVars: string[];
  apparatus: string[];
  safety: SafetyItem[];
  steps: string[];
  columns: ColumnSchema[];
  graph?: GraphConfig;
  keyEquation?: string;
  targetTrials: number;
}

export interface RecordedRow {
  id: string;
  timestamp: string;
  values: Record<string, string | number>;
  anomaly?: boolean;
  note?: string;
}

export interface PracticalNotebookEntry {
  rows: RecordedRow[];
  completedSteps: number[];
  conclusion: string;
  evaluation: string;
  lastUpdated?: string;
}

export type LabNotebookState = Record<PracticalId, PracticalNotebookEntry>;

export type AppView = 'directory' | 'bench' | 'notebook' | 'skills';
