import React, { useState } from 'react';
import {
  calculateActualSizeUm,
  calculatePercentMassChange,
  calculateRelativeLightIntensity,
  calculateZoneAreaMm2,
} from '../sim/biologyMath';

export const SkillsSafetyView: React.FC = () => {
  // Interactive AQA Biology Maths Calculators
  const [imgMm, setImgMm] = useState(22);
  const [mag, setMag] = useState(100);

  const [initMass, setInitMass] = useState(2.4);
  const [finalMass, setFinalMass] = useState(2.68);

  const [zoneDiam, setZoneDiam] = useState(24);
  const [lampDist, setLampDist] = useState(20);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-medium text-teal-800">AQA Working Scientifically & Apparatus Skills</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Practical Skills, Maths & Lab Safety
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Practise the core mathematical equations, experimental design vocabulary, and laboratory safety procedures assessed across AQA GCSE Biology Papers 1 and 2.
        </p>
      </div>

      {/* Interactive Equation Practice Strip */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">1. Interactive Required Practical Equations</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Magnification Calculator */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Magnification Formula (RP1)</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">Actual Size (A) = Image Size (I) ÷ Magnification (M)</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="calc-img-mm" className="block text-xs text-slate-600">Image Size (mm)</label>
                <input
                  id="calc-img-mm"
                  type="number"
                  step="0.5"
                  value={imgMm}
                  onChange={(e) => setImgMm(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="calc-mag" className="block text-xs text-slate-600">Total Magnification (×)</label>
                <input
                  id="calc-mag"
                  type="number"
                  step="10"
                  value={mag}
                  onChange={(e) => setMag(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
              Actual Cell Size: <span className="font-semibold text-teal-800">{calculateActualSizeUm(imgMm, mag)} µm</span>
            </div>
          </div>

          {/* Percentage Mass Change */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Percentage Change in Mass (RP3)</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">% Change = ((Final − Initial) ÷ Initial) × 100</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="calc-init-g" className="block text-xs text-slate-600">Initial Mass (g)</label>
                <input
                  id="calc-init-g"
                  type="number"
                  step="0.05"
                  value={initMass}
                  onChange={(e) => setInitMass(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="calc-final-g" className="block text-xs text-slate-600">Final Mass (g)</label>
                <input
                  id="calc-final-g"
                  type="number"
                  step="0.05"
                  value={finalMass}
                  onChange={(e) => setFinalMass(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
              Percentage Change:{' '}
              <span className="font-semibold text-teal-800">
                {calculatePercentMassChange(initMass, finalMass) >= 0 ? '+' : ''}
                {calculatePercentMassChange(initMass, finalMass)}%
              </span>
            </div>
          </div>

          {/* Zone of Inhibition Area */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Zone of Inhibition Area (RP2)</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">Area = π × r²  (where r = diameter ÷ 2)</p>
            <div className="mt-4">
              <label htmlFor="calc-zone-d" className="block text-xs text-slate-600">Clear Zone Diameter (mm)</label>
              <input
                id="calc-zone-d"
                type="number"
                step="1"
                value={zoneDiam}
                onChange={(e) => setZoneDiam(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
              />
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
              Radius: {(zoneDiam / 2).toFixed(1)} mm · Area:{' '}
              <span className="font-semibold text-teal-800">{calculateZoneAreaMm2(zoneDiam)} mm²</span>
            </div>
          </div>

          {/* Inverse Square Law */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Inverse Square Law (RP6)</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">Light Intensity ∝ 1 ÷ d²</p>
            <div className="mt-4">
              <label htmlFor="calc-lamp-d" className="block text-xs text-slate-600">Lamp Distance from Pondweed (cm)</label>
              <input
                id="calc-lamp-d"
                type="number"
                step="5"
                min="5"
                value={lampDist}
                onChange={(e) => setLampDist(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
              />
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
              Relative Light Intensity (1/d² × 10⁴):{' '}
              <span className="font-semibold text-teal-800">{calculateRelativeLightIntensity(lampDist)} a.u.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Practical Terminology & Safety Standards */}
      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">2. Working Scientifically Key Terms</h2>
          <dl className="mt-4 space-y-3 text-xs leading-relaxed">
            <div>
              <dt className="font-semibold text-slate-900">Independent, Dependent & Control Variables</dt>
              <dd className="text-slate-600">
                Change only one independent variable at a time, measure the dependent variable accurately, and keep all other factors constant so the investigation remains valid.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Repeatability vs Reproducibility</dt>
              <dd className="text-slate-600">
                A measurement is repeatable if the original experimenter repeats the investigation using the same method and equipment and gets similar results; reproducible if another group obtains similar results.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Anomalous Results</dt>
              <dd className="text-slate-600">
                Readings that do not fit the general pattern of repeat trials. Circle and exclude anomalies when calculating means or drawing a line of best fit.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Resolution & Accuracy</dt>
              <dd className="text-slate-600">
                Resolution is the smallest change an instrument can detect (e.g., 0.01 g on a digital balance, 1 mm on a ruler). Accuracy describes how close a measurement is to the true value.
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">3. School Biology Safety & Aseptic Rules</h2>
          <ul className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
            <li>
              <span className="font-semibold text-slate-900">Maximum 25 °C Incubation (RP2): </span>
              School laboratories never incubate agar plates at human body temperature (37 °C) to prevent culturing harmful human pathogens.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Tape Agar Lids at Two Points Only: </span>
              Completely sealing a petri dish cuts off oxygen and encourages dangerous anaerobic bacteria to grow. Store plates inverted so condensation does not drip onto the agar.
            </li>
            <li>
              <span className="font-semibold text-slate-900">Eye Protection for Reagents (RP1, RP4, RP5, RP10): </span>
              Wear safety goggles when handling iodine, Biuret reagent (contains corrosive sodium hydroxide), sodium carbonate, and Cresol red.
            </li>
            <li>
              <span className="font-semibold text-slate-900">LED Lamps & Water Baths (RP4, RP6): </span>
              Use LED bulbs near pondweed to prevent thermal heating of the water, and always use tongs with an 80 °C water bath during Benedict&apos;s tests.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};
