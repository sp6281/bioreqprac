import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalMagnification,
  calculateImageSizeMm,
  calculateActualSizeUm,
  calculateMicroscopeBlurPx,
  simulateZoneDiameterMm,
  calculateZoneAreaMm2,
  simulatePotatoOsmosis,
  calculatePercentMassChange,
  estimateIsotonicConcentration,
  evaluateFoodTest,
  simulateAmylaseDigestTimeSec,
  isStarchPresentAtTime,
  calculateRatePerThousandSec,
  calculateRelativeLightIntensity,
  simulatePhotosynthesisRate,
  dropDistanceCmToReactionMs,
  reactionMsToDropDistanceCm,
  simulateSeedlingDish,
  generateMeadowDaisies,
  countDaisiesInQuadrat,
  estimateTotalPopulation,
  getTransectLightLux,
  simulateMilkDecayTimeSec,
  getMilkDecayStateAtTime,
} from './biologyMath';

test('RP1 Microscopy magnification and cell size calculations', () => {
  assert.equal(calculateTotalMagnification(10, 40), 400);
  // 220 µm cell at 100× magnification = 22.0 mm image
  assert.equal(calculateImageSizeMm(220, 100), 22);
  assert.equal(calculateActualSizeUm(22, 100), 220);
  // Optimal focus gives zero blur; off-focus gives positive blur
  assert.equal(calculateMicroscopeBlurPx(62, 50, 62, 10), 0);
  assert.ok(calculateMicroscopeBlurPx(30, 50, 62, 40) > 5);
});

test('RP2 Microbiology zone of inhibition area calculation', () => {
  // Control water disc (6 mm) has 0 inhibition area beyond paper disc
  assert.equal(simulateZoneDiameterMm('water', 0), 6);
  assert.equal(calculateZoneAreaMm2(6), 0);
  // Penicillin (28 mm diameter -> r = 14 mm -> pi * 196 ≈ 615.8 mm²)
  const penD = simulateZoneDiameterMm('penicillin', 0);
  assert.equal(penD, 28);
  assert.equal(calculateZoneAreaMm2(penD), 615.8);
});

test('RP3 Osmosis mass change and isotonic concentration interpolation', () => {
  const pureWater = simulatePotatoOsmosis(0.0, 2.5, 0);
  assert.ok(pureWater.percentChange > 10, 'Potato should gain mass in pure water');
  assert.ok(pureWater.finalMass > pureWater.initialMass);

  const highSucrose = simulatePotatoOsmosis(1.0, 2.5, 0);
  assert.ok(highSucrose.percentChange < -15, 'Potato should lose mass in 1.0 mol/dm³ sucrose');
  assert.ok(highSucrose.finalMass < highSucrose.initialMass);

  assert.equal(calculatePercentMassChange(2.0, 2.2), 10);
  assert.equal(calculatePercentMassChange(2.0, 1.8), -10);

  const isotonic = estimateIsotonicConcentration([
    { concentration: 0.0, percentChange: 14.5 },
    { concentration: 0.2, percentChange: 5.5 },
    { concentration: 0.4, percentChange: -3.0 },
    { concentration: 0.8, percentChange: -18.0 },
  ]);
  assert.ok(isotonic !== null && isotonic > 0.28 && isotonic < 0.36);
});

test('RP4 Food Tests qualitative reagent reactions and Benedict heat requirement', () => {
  assert.equal(evaluateFoodTest('potato', 'iodine', false).positive, true);
  assert.equal(evaluateFoodTest('eggWhite', 'iodine', false).positive, false);

  // Benedict's without heating must warn and stay negative
  const unheatedApple = evaluateFoodTest('apple', 'benedicts', false);
  assert.equal(unheatedApple.positive, false);
  assert.equal(unheatedApple.requiresHeatWarning, true);

  // Heated Benedict's on apple juice gives brick-red positive
  const heatedApple = evaluateFoodTest('apple', 'benedicts', true);
  assert.equal(heatedApple.positive, true);
  assert.match(heatedApple.observation, /Brick-red/i);

  assert.equal(evaluateFoodTest('eggWhite', 'biuret', false).positive, true);
  assert.equal(evaluateFoodTest('oil', 'sudanIII', false).positive, true);
  assert.ok(evaluateFoodTest('oil', 'sudanIII', false).topLayerHex);
});

test('RP5 Enzymes amylase pH optimum and extreme pH denaturation', () => {
  const tOptimum = simulateAmylaseDigestTimeSec(7, 0);
  const tAcidic = simulateAmylaseDigestTimeSec(5, 0);
  const tDenatured = simulateAmylaseDigestTimeSec(3, 0);

  assert.equal(tOptimum, 60);
  assert.ok(tAcidic !== null && tAcidic > tOptimum);
  assert.equal(tDenatured, null);

  assert.equal(isStarchPresentAtTime(30, 60), true);
  assert.equal(isStarchPresentAtTime(60, 60), false);
  assert.equal(calculateRatePerThousandSec(60), 16.67);
  assert.equal(calculateRatePerThousandSec(null), 0);
});

test('RP6 Photosynthesis inverse square law and CO2 limiting factor', () => {
  assert.equal(calculateRelativeLightIntensity(10), 100);
  assert.equal(calculateRelativeLightIntensity(20), 25); // 2x distance -> 1/4 intensity

  const nearRate = simulatePhotosynthesisRate(10, true, 0);
  const farRate = simulatePhotosynthesisRate(50, true, 0);
  const lowCo2Rate = simulatePhotosynthesisRate(10, false, 0);

  assert.ok(nearRate > farRate * 3, 'Closer lamp should significantly increase bubble rate');
  assert.ok(nearRate > lowCo2Rate * 2, 'Excess NaHCO3 should increase rate compared to plain water');
});

test('RP7 Reaction time physics conversion d = 0.5*g*t^2', () => {
  // 19.62 cm drop = sqrt(2 * 0.1962 / 9.81) = 0.20 s = 200 ms
  assert.equal(dropDistanceCmToReactionMs(19.62), 200);
  assert.equal(reactionMsToDropDistanceCm(200), 19.6);
});

test('RP8 Plant responses phototropism and dark etiolation', () => {
  const full = simulateSeedlingDish('fullLight', 7, true);
  const dir = simulateSeedlingDish('directionalLight', 7, true);
  const dark = simulateSeedlingDish('darkness', 7, true);

  assert.equal(full.bendAngleDeg, 0);
  assert.ok(dir.bendAngleDeg > 35, 'Directional light shoots should curve strongly toward slit');
  assert.ok(dark.meanHeightMm > full.meanHeightMm + 15, 'Dark seedlings should show taller etiolated shoots');
});

test('RP9 Field investigations quadrat estimation and shade transect gradient', () => {
  const daisies = generateMeadowDaisies(42);
  assert.ok(daisies.length > 500, 'Meadow should contain realistic population of daisies');

  const shadeCount = countDaisiesInQuadrat(daisies, 0.2, 4.0, 0.5).length;
  const sunCount = countDaisiesInQuadrat(daisies, 8.5, 4.0, 0.5).length;
  assert.ok(sunCount >= shadeCount, 'Open sunlight should generally support more daisies than deep shade');

  assert.equal(estimateTotalPopulation([4, 6, 5, 5], 100, 0.25), 2000);
  assert.ok(getTransectLightLux(10) > getTransectLightLux(0) * 10);
});

test('RP10 Milk decay lipase optimum temperature and 60°C denaturation', () => {
  const t10 = simulateMilkDecayTimeSec(10, 0);
  const t40 = simulateMilkDecayTimeSec(40, 0);
  const t60 = simulateMilkDecayTimeSec(60, 0);

  assert.ok(t10 !== null && t40 !== null && t40 < t10, '40°C should decay faster than 10°C');
  assert.equal(t60, null, '60°C should denature lipase');

  const startState = getMilkDecayStateAtTime(0, t40);
  const endState = getMilkDecayStateAtTime(t40!, t40);
  assert.equal(startState.finished, false);
  assert.equal(endState.finished, true);
  assert.ok(endState.ph < startState.ph);
});
