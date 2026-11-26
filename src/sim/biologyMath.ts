/**
 * Pure scientific simulation models and mathematical functions for all 10 AQA GCSE Biology Required Practicals.
 * Deterministic when jitterSeed = 0 for repeatable unit testing; supports realistic small experimental noise in lab mode.
 */

function seededNoise(seed: number, amplitude: number): number {
  if (seed === 0 || amplitude === 0) return 0;
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac * 2 - 1) * amplitude;
}

/* =========================================================================
 * RP1: MICROSCOPY
 * ========================================================================= */
export type SpecimenId = 'onion' | 'cheek' | 'rootTip';

export interface SpecimenInfo {
  id: SpecimenId;
  name: string;
  stainName: string;
  actualCellLengthUm: number;
  structures: string[];
  optimalFocus: number; // 0 to 100
}

export const SPECIMENS: Record<SpecimenId, SpecimenInfo> = {
  onion: {
    id: 'onion',
    name: 'Onion Epidermis (Plant)',
    stainName: 'Iodine solution',
    actualCellLengthUm: 220,
    structures: ['Cell wall', 'Cell membrane', 'Cytoplasm', 'Nucleus', 'Large vacuole'],
    optimalFocus: 62,
  },
  cheek: {
    id: 'cheek',
    name: 'Human Cheek Cells (Animal)',
    stainName: 'Methylene blue',
    actualCellLengthUm: 60,
    structures: ['Cell membrane', 'Cytoplasm', 'Nucleus'],
    optimalFocus: 48,
  },
  rootTip: {
    id: 'rootTip',
    name: 'Garlic Root Tip (Mitosis)',
    stainName: 'Toluidine blue',
    actualCellLengthUm: 45,
    structures: ['Cell wall', 'Condensed chromosomes', 'Nucleus', 'Cytoplasm'],
    optimalFocus: 74,
  },
};

export function calculateTotalMagnification(eyepieceMag: number, objectiveMag: number): number {
  return eyepieceMag * objectiveMag;
}

/**
 * Given actual size in micrometres (µm) and total magnification, returns observed image size in mm.
 * Formula: I = A × M (with 1 mm = 1000 µm)
 */
export function calculateImageSizeMm(actualSizeUm: number, totalMagnification: number): number {
  return Number(((actualSizeUm * totalMagnification) / 1000).toFixed(2));
}

/**
 * Given observed image size in mm and total magnification, returns actual size in micrometres (µm).
 */
export function calculateActualSizeUm(imageSizeMm: number, totalMagnification: number): number {
  if (totalMagnification <= 0) return 0;
  return Number(((imageSizeMm * 1000) / totalMagnification).toFixed(1));
}

/**
 * Calculates optical blur in pixels based on coarse & fine focus dials vs specimen optimal focus.
 */
export function calculateMicroscopeBlurPx(
  coarseFocus: number,
  fineFocus: number,
  optimalFocus: number,
  objectiveMag: number
): number {
  const effectiveFocus = coarseFocus + (fineFocus - 50) * 0.16;
  const delta = Math.abs(effectiveFocus - optimalFocus);
  // Higher magnification has shallower depth of field -> more sensitive to defocus
  const sensitivity = objectiveMag === 40 ? 0.55 : objectiveMag === 10 ? 0.35 : 0.22;
  return Number(Math.min(14, delta * sensitivity).toFixed(2));
}

/* =========================================================================
 * RP2: MICROBIOLOGY (Zones of Inhibition)
 * ========================================================================= */
export type AntimicrobialAgentId = 'water' | 'antisepticA' | 'antisepticB' | 'penicillin';

export interface AntimicrobialAgent {
  id: AntimicrobialAgentId;
  label: string;
  shortCode: string;
  baseDiameterMm: number; // Disc itself is 6 mm; 6 mm = no zone of inhibition
}

export const ANTIMICROBIAL_AGENTS: Record<AntimicrobialAgentId, AntimicrobialAgent> = {
  water: { id: 'water', label: 'Distilled Water (Control)', shortCode: 'W', baseDiameterMm: 6 },
  antisepticA: { id: 'antisepticA', label: 'TCP Antiseptic', shortCode: 'A', baseDiameterMm: 16 },
  antisepticB: { id: 'antisepticB', label: 'Dettol Antiseptic', shortCode: 'B', baseDiameterMm: 22 },
  penicillin: { id: 'penicillin', label: 'Penicillin Antibiotic', shortCode: 'P', baseDiameterMm: 28 },
};

export function simulateZoneDiameterMm(agentId: AntimicrobialAgentId, jitterSeed = 0): number {
  const base = ANTIMICROBIAL_AGENTS[agentId].baseDiameterMm;
  if (base <= 6) return 6;
  const raw = base + seededNoise(jitterSeed, 1.2);
  return Number(Math.max(6, raw).toFixed(1));
}

export function calculateZoneAreaMm2(diameterMm: number): number {
  if (diameterMm <= 6) return 0; // No clear inhibition beyond the 6 mm paper disc
  const r = diameterMm / 2;
  return Number((Math.PI * r * r).toFixed(1));
}

/* =========================================================================
 * RP3: OSMOSIS IN POTATO TISSUE
 * ========================================================================= */
export const SUCROSE_CONCENTRATIONS = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0] as const;

/**
 * True potato cell sap isotonic concentration is ~0.32 mol/dm³.
 * At 0.0 mol/dm³, potato gains ~14.5% mass (turgid).
 * At 1.0 mol/dm³, potato loses ~24.5% mass (flaccid / plasmolysed).
 */
export function simulatePotatoOsmosis(
  concentrationMolDm3: number,
  initialMassG = 2.4,
  jitterSeed = 0
): { initialMass: number; finalMass: number; massChange: number; percentChange: number; cellState: string } {
  const isotonic = 0.32;
  // Slightly curved biological osmotic response
  const diff = isotonic - concentrationMolDm3;
  const basePct = diff >= 0 ? diff * 46 : diff * 37.5;
  const pct = basePct + seededNoise(jitterSeed, 1.1);
  const finalMass = Number((initialMassG * (1 + pct / 100)).toFixed(2));
  const massChange = Number((finalMass - initialMassG).toFixed(2));
  const percentChange = calculatePercentMassChange(initialMassG, finalMass);

  let cellState = 'Isotonic (no net water movement)';
  if (percentChange > 2) cellState = 'Turgid (water entered by osmosis)';
  else if (percentChange < -2) cellState = 'Flaccid / Plasmolysed (water left by osmosis)';

  return {
    initialMass: Number(initialMassG.toFixed(2)),
    finalMass,
    massChange,
    percentChange,
    cellState,
  };
}

export function calculatePercentMassChange(initialMass: number, finalMass: number): number {
  if (initialMass <= 0) return 0;
  return Number((((finalMass - initialMass) / initialMass) * 100).toFixed(1));
}

/**
 * Estimates isotonic sucrose concentration (x-intercept where % change = 0) via linear interpolation
 * between points straddling y = 0, or linear regression fallback.
 */
export function estimateIsotonicConcentration(
  points: Array<{ concentration: number; percentChange: number }>
): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.concentration - b.concentration);
  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    if ((p1.percentChange >= 0 && p2.percentChange <= 0) || (p1.percentChange <= 0 && p2.percentChange >= 0)) {
      const dy = p2.percentChange - p1.percentChange;
      if (Math.abs(dy) < 1e-6) return Number(p1.concentration.toFixed(2));
      const xZero = p1.concentration + ((0 - p1.percentChange) * (p2.concentration - p1.concentration)) / dy;
      return Number(xZero.toFixed(2));
    }
  }
  return null;
}

/* =========================================================================
 * RP4: FOOD TESTS (Qualitative Reagents)
 * ========================================================================= */
export type FoodSampleId = 'potato' | 'apple' | 'eggWhite' | 'oil' | 'milk' | 'mystery';
export type ReagentId = 'iodine' | 'benedicts' | 'biuret' | 'sudanIII';

export interface FoodComposition {
  id: FoodSampleId;
  name: string;
  baseColorHex: string;
  starch: boolean;
  reducingSugar: 'none' | 'low' | 'high';
  protein: boolean;
  lipid: boolean;
}

export const FOOD_SAMPLES: Record<FoodSampleId, FoodComposition> = {
  potato: {
    id: 'potato',
    name: 'Potato Extract',
    baseColorHex: '#F3EFE4',
    starch: true,
    reducingSugar: 'none',
    protein: false,
    lipid: false,
  },
  apple: {
    id: 'apple',
    name: 'Apple Juice',
    baseColorHex: '#F7E7B4',
    starch: false,
    reducingSugar: 'high',
    protein: false,
    lipid: false,
  },
  eggWhite: {
    id: 'eggWhite',
    name: 'Egg White (Albumen)',
    baseColorHex: '#F5F7FA',
    starch: false,
    reducingSugar: 'none',
    protein: true,
    lipid: false,
  },
  oil: {
    id: 'oil',
    name: 'Vegetable Oil',
    baseColorHex: '#FDE047',
    starch: false,
    reducingSugar: 'none',
    protein: false,
    lipid: true,
  },
  milk: {
    id: 'milk',
    name: 'Full-Fat Milk',
    baseColorHex: '#FFFFFF',
    starch: false,
    reducingSugar: 'low',
    protein: true,
    lipid: true,
  },
  mystery: {
    id: 'mystery',
    name: 'Mystery Food X',
    baseColorHex: '#EFECE6',
    starch: true,
    reducingSugar: 'none',
    protein: true,
    lipid: false,
  },
};

export interface FoodTestOutcome {
  tubeColorHex: string;
  topLayerHex?: string;
  positive: boolean;
  observation: string;
  conclusion: string;
  requiresHeatWarning?: boolean;
}

export function evaluateFoodTest(
  sampleId: FoodSampleId,
  reagentId: ReagentId,
  heatedInWaterBath: boolean
): FoodTestOutcome {
  const food = FOOD_SAMPLES[sampleId];

  if (reagentId === 'iodine') {
    if (food.starch) {
      return {
        tubeColorHex: '#1E1B4B',
        positive: true,
        observation: 'Turned blue-black',
        conclusion: 'Starch present (Positive)',
      };
    }
    return {
      tubeColorHex: '#C27803',
      positive: false,
      observation: 'Remained orange-brown',
      conclusion: 'No starch detected (Negative)',
    };
  }

  if (reagentId === 'benedicts') {
    if (!heatedInWaterBath) {
      return {
        tubeColorHex: '#2563EB',
        positive: false,
        observation: 'Remained blue (not heated)',
        conclusion: 'Requires 80 °C water bath to react',
        requiresHeatWarning: true,
      };
    }
    if (food.reducingSugar === 'high') {
      return {
        tubeColorHex: '#B91C1C',
        positive: true,
        observation: 'Brick-red precipitate formed',
        conclusion: 'High reducing sugar present (Positive)',
      };
    }
    if (food.reducingSugar === 'low') {
      return {
        tubeColorHex: '#65A30D',
        positive: true,
        observation: 'Turned green-yellow',
        conclusion: 'Low reducing sugar present (Positive)',
      };
    }
    return {
      tubeColorHex: '#2563EB',
      positive: false,
      observation: 'Remained clear blue',
      conclusion: 'No reducing sugars (Negative)',
    };
  }

  if (reagentId === 'biuret') {
    if (food.protein) {
      return {
        tubeColorHex: '#9333EA',
        positive: true,
        observation: 'Turned lilac / purple',
        conclusion: 'Protein present (Positive)',
      };
    }
    return {
      tubeColorHex: '#3B82F6',
      positive: false,
      observation: 'Remained pale blue',
      conclusion: 'No protein detected (Negative)',
    };
  }

  // Sudan III lipid test
  if (food.lipid) {
    return {
      tubeColorHex: food.baseColorHex,
      topLayerHex: '#DC2626',
      positive: true,
      observation: 'Bright red stained layer separated at top',
      conclusion: 'Lipids present (Positive)',
    };
  }
  return {
    tubeColorHex: '#FCA5A5',
    positive: false,
    observation: 'No separate red top layer formed',
    conclusion: 'No lipids detected (Negative)',
  };
}

/* =========================================================================
 * RP5: ENZYMES (Effect of pH on Amylase)
 * ========================================================================= */
export const ENZYME_PH_VALUES = [3, 5, 6, 7, 8, 9, 11] as const;

/**
 * Returns the digestion endpoint time in seconds (in 30s spotting-tile intervals) for amylase at a given pH at 35°C.
 * Optimum pH for salivary/pancreatic amylase is pH 7.
 * Returns null if enzyme is fully denatured (>360 s, never completes in 12 wells).
 */
export function simulateAmylaseDigestTimeSec(ph: number, jitterSeed = 0): number | null {
  if (ph <= 3 || ph >= 11) {
    return null; // Denatured — starch remains blue-black across all 12 wells (360s)
  }
  const distanceFromOptimum = Math.abs(ph - 7);
  // pH 7 -> ~60s, pH 6/8 -> ~120s, pH 5/9 -> ~240s
  const idealSec = 60 + Math.pow(distanceFromOptimum, 1.85) * 52;
  const noisy = idealSec + seededNoise(jitterSeed, 12);
  // Quantise to 30-second spotting tile intervals (minimum 30s, max 360s)
  const quantised = Math.max(30, Math.round(noisy / 30) * 30);
  return quantised > 360 ? null : quantised;
}

export function isStarchPresentAtTime(elapsedSec: number, endpointSec: number | null): boolean {
  if (endpointSec === null) return true;
  return elapsedSec < endpointSec;
}

export function calculateRatePerThousandSec(timeSec: number | null): number {
  if (timeSec === null || timeSec <= 0) return 0;
  return Number((1000 / timeSec).toFixed(2));
}

/* =========================================================================
 * RP6: PHOTOSYNTHESIS (Pondweed & Inverse Square Law)
 * ========================================================================= */
export const LAMP_DISTANCES_CM = [10, 20, 30, 40, 50] as const;

/**
 * Relative light intensity using inverse square law (scaled ×10,000 so 10 cm = 100 a.u., 20 cm = 25 a.u.)
 */
export function calculateRelativeLightIntensity(distanceCm: number): number {
  if (distanceCm <= 0) return 0;
  return Number((10000 / (distanceCm * distanceCm)).toFixed(1));
}

/**
 * Simulates oxygen bubbles per minute from Elodea pondweed.
 * Uses Michaelis-Menten saturation curve with light intensity (1/d²), halved if plain water (low CO₂) is used.
 */
export function simulatePhotosynthesisRate(
  distanceCm: number,
  hasNaHCO3 = true,
  jitterSeed = 0
): number {
  const intensity = calculateRelativeLightIntensity(distanceCm);
  const vMax = hasNaHCO3 ? 72 : 24; // Excess NaHCO3 vs CO2-limited plain water
  const km = 28;
  const rate = (vMax * intensity) / (km + intensity);
  return Math.max(1, Math.round(rate + seededNoise(jitterSeed, 1.6)));
}

/* =========================================================================
 * RP7: REACTION TIME (Ruler Drop Test)
 * ========================================================================= */
export type ReactionConditionId = 'baseline' | 'caffeine' | 'distraction' | 'practice';

export const REACTION_CONDITIONS: Record<
  ReactionConditionId,
  { id: ReactionConditionId; label: string; description: string; latencyOffsetMs: number }
> = {
  baseline: {
    id: 'baseline',
    label: 'Baseline (Control)',
    description: 'Quiet laboratory conditions with standard concentration.',
    latencyOffsetMs: 0,
  },
  caffeine: {
    id: 'caffeine',
    label: 'Caffeinated',
    description: 'Mild central nervous stimulant reducing synaptic response latency (~25 ms faster).',
    latencyOffsetMs: -25,
  },
  distraction: {
    id: 'distraction',
    label: 'Distraction (Noise)',
    description: 'Divided visual/auditory attention increasing processing delay (+65 ms slower).',
    latencyOffsetMs: 65,
  },
  practice: {
    id: 'practice',
    label: 'Practised (Repeated)',
    description: 'Motor pathway familiarity slightly improving response speed (~18 ms faster).',
    latencyOffsetMs: -18,
  },
};

/**
 * Converts ruler drop distance in cm to reaction time in milliseconds using d = 0.5 * g * t²
 */
export function dropDistanceCmToReactionMs(distanceCm: number): number {
  if (distanceCm <= 0) return 0;
  const dMeters = distanceCm / 100;
  const g = 9.81;
  const tSec = Math.sqrt((2 * dMeters) / g);
  return Math.round(tSec * 1000);
}

/**
 * Converts elapsed fall time in ms to drop distance in cm.
 */
export function reactionMsToDropDistanceCm(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const tSec = elapsedMs / 1000;
  return Number((0.5 * 9.81 * tSec * tSec * 100).toFixed(1));
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Number((sum / values.length).toFixed(1));
}

/* =========================================================================
 * RP8: PLANT RESPONSES (Germination & Phototropism)
 * ========================================================================= */
export type LightConditionId = 'fullLight' | 'directionalLight' | 'darkness';

export interface SeedlingMetrics {
  conditionId: LightConditionId;
  label: string;
  shootHeightsMm: number[];
  meanHeightMm: number;
  bendAngleDeg: number; // + right toward slit, 0 upright
  leafColorHex: string;
  stemColorHex: string;
  appearance: string;
}

export function simulateSeedlingDish(
  conditionId: LightConditionId,
  day: number,
  watered: boolean
): SeedlingMetrics {
  const d = Math.max(0, Math.min(7, day));
  const waterFactor = watered ? 1 : 0.25;
  const offsets = [-1.5, 0.8, 1.4, -0.6, 0.2];

  if (conditionId === 'fullLight') {
    const base = (4 + d * 4.2) * waterFactor;
    const heights = offsets.map((o) => Number(Math.max(2, base + o).toFixed(1)));
    return {
      conditionId,
      label: 'Full Overhead Light',
      shootHeightsMm: heights,
      meanHeightMm: calculateMean(heights),
      bendAngleDeg: 0,
      leafColorHex: '#15803D',
      stemColorHex: '#4ADE80',
      appearance: watered ? 'Short, sturdy, upright green shoots' : 'Wilted, stunted growth (unwatered)',
    };
  }

  if (conditionId === 'directionalLight') {
    const base = (4 + d * 5.1) * waterFactor;
    const heights = offsets.map((o) => Number(Math.max(2, base + o * 1.1).toFixed(1)));
    const bend = Math.round(d * 6.5 * waterFactor);
    return {
      conditionId,
      label: 'Directional Light (Side Slit)',
      shootHeightsMm: heights,
      meanHeightMm: calculateMean(heights),
      bendAngleDeg: bend,
      leafColorHex: '#16A34A',
      stemColorHex: '#86EFAC',
      appearance: watered
        ? 'Curved strongly toward light slit (+ve phototropism)'
        : 'Weak bend, dehydrated (unwatered)',
    };
  }

  // Complete darkness -> etiolation (tall, spindly, pale yellow leaves)
  const base = (4 + d * 7.8) * waterFactor;
  const heights = offsets.map((o) => Number(Math.max(2, base + o * 1.4).toFixed(1)));
  return {
    conditionId,
    label: 'Complete Darkness',
    shootHeightsMm: heights,
    meanHeightMm: calculateMean(heights),
    bendAngleDeg: 0,
    leafColorHex: '#EAB308',
    stemColorHex: '#FEF08A',
    appearance: watered
      ? 'Tall, thin, pale yellow shoots (etiolation)'
      : 'Spindly and dried out (unwatered)',
  };
}

/* =========================================================================
 * RP9: FIELD INVESTIGATIONS (Quadrats & Belt Transect)
 * ========================================================================= */
export interface DaisyPoint {
  id: number;
  x: number; // 0 to 10 m
  y: number; // 0 to 10 m
}

/**
 * Deterministically generates a realistic 10 m × 10 m meadow of daisies.
 * Oak tree sits along x = 0 m edge (deep shade); sunlight increases toward x = 10 m.
 */
export function generateMeadowDaisies(seed = 42): DaisyPoint[] {
  const daisies: DaisyPoint[] = [];
  let state = seed;
  const nextRand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  // Generate ~1,400 daisies across 100 m² (~3.5 per 0.25 m² quadrat on average, skewed toward sunlit side)
  let id = 1;
  for (let i = 0; i < 2100; i++) {
    const x = Number((nextRand() * 10).toFixed(2));
    const y = Number((nextRand() * 10).toFixed(2));
    // Survival probability rises smoothly from x=0 (tree canopy shade) to x=10 (open sun)
    const sunProb = 0.08 + 0.88 * Math.min(1, x / 8.5);
    if (nextRand() < sunProb) {
      daisies.push({ id: id++, x, y });
    }
  }
  return daisies;
}

export function countDaisiesInQuadrat(
  daisies: DaisyPoint[],
  qx: number,
  qy: number,
  sizeM = 0.5
): DaisyPoint[] {
  return daisies.filter(
    (d) => d.x >= qx && d.x < qx + sizeM && d.y >= qy && d.y < qy + sizeM
  );
}

export function estimateTotalPopulation(
  quadratCounts: number[],
  totalHabitatAreaM2 = 100,
  quadratAreaM2 = 0.25
): number {
  if (quadratCounts.length === 0 || quadratAreaM2 <= 0) return 0;
  const meanPerQuadrat = calculateMean(quadratCounts);
  return Math.round((totalHabitatAreaM2 / quadratAreaM2) * meanPerQuadrat);
}

export function getTransectLightLux(distanceFromTreeM: number): number {
  const clamped = Math.max(0, Math.min(10, distanceFromTreeM));
  // 1,200 lux under canopy up to 18,500 lux in open sun
  return Math.round(1200 + 17300 * Math.min(1, Math.pow(clamped / 8.5, 1.25)));
}

/* =========================================================================
 * RP10: DECAY OF FRESH MILK (Lipase + Cresol Red)
 * ========================================================================= */
export const DECAY_TEMPS_C = [10, 20, 30, 40, 50, 60] as const;

/**
 * Returns time in seconds for milk + Na2CO3 + Cresol red to drop from pH 8.6 to pH 7.2 (yellow).
 * Optimum temperature for lipase is ~40 °C (~38 s). At 60 °C enzyme denatures (returns null).
 */
export function simulateMilkDecayTimeSec(tempC: number, jitterSeed = 0): number | null {
  if (tempC >= 60) return null; // Denatured lipase -> stays purple
  const table: Record<number, number> = {
    10: 210,
    20: 115,
    30: 62,
    40: 38,
    50: 84,
  };
  const base = table[tempC] ?? 90;
  return Math.max(15, Math.round(base + seededNoise(jitterSeed, 3.5)));
}

export function getMilkDecayStateAtTime(
  elapsedSec: number,
  endpointSec: number | null
): { ph: number; colorHex: string; label: string; finished: boolean } {
  if (endpointSec === null) {
    return {
      ph: 8.6,
      colorHex: '#9333EA',
      label: 'Purple (Alkaline — Lipase Denatured)',
      finished: false,
    };
  }
  const progress = Math.min(1, elapsedSec / endpointSec);
  const ph = Number((8.6 - progress * 1.45).toFixed(2));
  if (progress < 0.45) {
    return { ph, colorHex: '#9333EA', label: 'Purple (Alkaline)', finished: false };
  }
  if (progress < 0.85) {
    return { ph, colorHex: '#EA580C', label: 'Orange-Pink (Neutralising)', finished: false };
  }
  if (progress < 1) {
    return { ph, colorHex: '#F59E0B', label: 'Amber (Nearly Yellow)', finished: false };
  }
  return { ph: 7.15, colorHex: '#FACC15', label: 'Yellow Endpoint (Fatty Acids Released)', finished: true };
}
