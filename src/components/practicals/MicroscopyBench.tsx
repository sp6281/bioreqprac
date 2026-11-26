import React, { useState } from 'react';
import {
  SPECIMENS,
  type SpecimenId,
  calculateTotalMagnification,
  calculateImageSizeMm,
  calculateActualSizeUm,
  calculateMicroscopeBlurPx,
} from '../../sim/biologyMath';

export interface BenchProps {
  onRecordRow: (values: Record<string, string | number>) => void;
  onCompleteStep: (stepIndex: number) => void;
}

export const MicroscopyBench: React.FC<BenchProps> = ({ onRecordRow, onCompleteStep }) => {
  const [specimenId, setSpecimenId] = useState<SpecimenId>('onion');
  const [slidePlaced, setSlidePlaced] = useState(false);
  const [stained, setStained] = useState(false);
  const [coverslipAdded, setCoverslipAdded] = useState(false);
  const [objectiveMag, setObjectiveMag] = useState<4 | 10 | 40>(4);
  const [coarseFocus, setCoarseFocus] = useState(25);
  const [fineFocus, setFineFocus] = useState(50);
  const [showGraticule, setShowGraticule] = useState(true);
  const [lightLevel, setLightLevel] = useState(85);
  const [studentImageMm, setStudentImageMm] = useState('');
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

  const specimen = SPECIMENS[specimenId];
  const totalMag = calculateTotalMagnification(10, objectiveMag);
  const blurPx = calculateMicroscopeBlurPx(coarseFocus, fineFocus, specimen.optimalFocus, objectiveMag);
  const isSharp = blurPx <= 1.2;
  const trueImageMm = calculateImageSizeMm(specimen.actualCellLengthUm, totalMag);

  const handleSelectSpecimen = (id: SpecimenId) => {
    setSpecimenId(id);
    setSlidePlaced(false);
    setStained(false);
    setCoverslipAdded(false);
    setCoarseFocus(25);
    setFineFocus(50);
    setObjectiveMag(4);
    setStudentImageMm('');
    setRecordFeedback(null);
  };

  const handlePlaceSlide = () => {
    setSlidePlaced(true);
    onCompleteStep(0);
  };

  const handleAddStain = () => {
    if (!slidePlaced) return;
    setStained(true);
    onCompleteStep(1);
  };

  const handleLowerCoverslip = () => {
    if (!slidePlaced) return;
    setCoverslipAdded(true);
    onCompleteStep(2);
    onCompleteStep(3);
  };

  const handleCoarseChange = (val: number) => {
    setCoarseFocus(val);
    if (calculateMicroscopeBlurPx(val, fineFocus, specimen.optimalFocus, objectiveMag) <= 1.5) {
      onCompleteStep(4);
    }
  };

  const handleFineChange = (val: number) => {
    setFineFocus(val);
    if (calculateMicroscopeBlurPx(coarseFocus, val, specimen.optimalFocus, objectiveMag) <= 1.2) {
      onCompleteStep(4);
    }
  };

  const handleRecordObservation = () => {
    if (!slidePlaced || !coverslipAdded) {
      setRecordFeedback('Prepare the slide and lower the coverslip before recording.');
      return;
    }
    if (!isSharp) {
      setRecordFeedback('Bring the specimen into sharp focus (blur ≤ 1.2 px) before measuring.');
      return;
    }
    const parsedMm = studentImageMm.trim() ? Number(studentImageMm) : trueImageMm;
    if (!Number.isFinite(parsedMm) || parsedMm <= 0) {
      setRecordFeedback('Enter a valid positive image size in mm.');
      return;
    }
    const calcActualUm = calculateActualSizeUm(parsedMm, totalMag);
    onRecordRow({
      specimen: specimen.name,
      totalMag,
      imageSizeMm: Number(parsedMm.toFixed(2)),
      actualSizeUm: calcActualUm,
      structures: stained ? specimen.structures.join(', ') : 'Faint outline (unstained)',
    });
    onCompleteStep(5);
    setRecordFeedback(
      `Recorded at ${totalMag}× — Calculated actual size: ${calcActualUm} µm (true specimen: ${specimen.actualCellLengthUm} µm).`
    );
  };

  // Visual cell scale inside the 320×320 ocular viewport
  const zoomScale = objectiveMag === 4 ? 0.55 : objectiveMag === 10 ? 1.0 : 2.1;

  return (
    <div className="space-y-5">
      {/* Slide preparation bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">1. Slide Preparation</h3>
            <p className="text-xs text-slate-500">
              Select a specimen, mount it flat, apply stain, and lower the coverslip at 45°.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Specimen selector">
            {(Object.keys(SPECIMENS) as SpecimenId[]).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={specimenId === id}
                onClick={() => handleSelectSpecimen(id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  specimenId === id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {id === 'onion' ? 'Onion Epidermis' : id === 'cheek' ? 'Cheek Cells' : 'Root Tip'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePlaceSlide}
            className={`rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              slidePlaced
                ? 'border-teal-600 bg-teal-50 text-teal-800'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {slidePlaced ? '✓ 1. Specimen Mounted' : '1. Mount Specimen on Slide'}
          </button>
          <button
            type="button"
            disabled={!slidePlaced}
            onClick={handleAddStain}
            className={`rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              stained
                ? 'border-teal-600 bg-teal-50 text-teal-800'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {stained ? `✓ 2. ${specimen.stainName} Added` : `2. Add ${specimen.stainName}`}
          </button>
          <button
            type="button"
            disabled={!slidePlaced}
            onClick={handleLowerCoverslip}
            className={`rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              coverslipAdded
                ? 'border-teal-600 bg-teal-50 text-teal-800'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {coverslipAdded ? '✓ 3. Coverslip Lowered (45°)' : '3. Lower Coverslip at 45°'}
          </button>
        </div>
      </div>

      {/* Main Optical Viewport + Controls Split */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Ocular Field of View */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-900 p-5 lg:col-span-7">
          <div className="mb-3 flex w-full items-center justify-between text-xs text-slate-300">
            <span className="font-mono">
              Ocular Field · {totalMag}× (10× eyepiece × {objectiveMag}× objective)
            </span>
            <span
              className={`font-mono font-medium ${
                !slidePlaced ? 'text-slate-400' : isSharp ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {!slidePlaced ? 'Stage empty' : isSharp ? '● In Sharp Focus' : '▲ Out of Focus'}
            </span>
          </div>

          <div
            className="relative flex h-72 w-72 items-center justify-center overflow-hidden rounded-full border-4 border-slate-700 shadow-inner"
            style={{
              backgroundColor: `rgb(${Math.round(215 * (lightLevel / 100) + 35)}, ${Math.round(
                220 * (lightLevel / 100) + 32
              )}, ${Math.round(212 * (lightLevel / 100) + 28)})`,
            }}
            data-testid="microscope-viewport"
          >
            {!slidePlaced ? (
              <p className="px-6 text-center text-xs font-medium text-slate-600">
                Mount a prepared slide onto the stage to view cells.
              </p>
            ) : (
              <svg
                viewBox="0 0 320 320"
                className="h-full w-full transition-[filter] duration-100"
                style={{ filter: `blur(${blurPx}px)` }}
                role="img"
                aria-label={`Microscope view of ${specimen.name} at ${totalMag}x magnification`}
              >
                <g transform={`translate(160 160) scale(${zoomScale}) translate(-160 -160)`}>
                  {specimenId === 'onion' && (
                    <g>
                      {[0, 1, 2, 3, 4].map((row) =>
                        [0, 1, 2].map((col) => {
                          const x = 10 + col * 102 + (row % 2) * 42 - 20;
                          const y = 18 + row * 58;
                          return (
                            <g key={`${row}-${col}`}>
                              <rect
                                x={x}
                                y={y}
                                width="98"
                                height="54"
                                rx="6"
                                fill={stained ? '#FDE68A' : '#F8FAFC'}
                                fillOpacity={stained ? '0.68' : '0.35'}
                                stroke={stained ? '#92400E' : '#94A3B8'}
                                strokeWidth="2.4"
                              />
                              {/* Large central vacuole */}
                              <rect
                                x={x + 8}
                                y={y + 8}
                                width="82"
                                height="38"
                                rx="4"
                                fill={stained ? '#FEF9C3' : '#FFFFFF'}
                                fillOpacity="0.45"
                              />
                              {/* Stained nucleus */}
                              <ellipse
                                cx={x + 24 + ((row + col) % 3) * 20}
                                cy={y + 27}
                                rx="6.5"
                                ry="5"
                                fill={stained ? '#78350F' : '#CBD5E1'}
                                fillOpacity={stained ? '0.9' : '0.35'}
                              />
                            </g>
                          );
                        })
                      )}
                    </g>
                  )}

                  {specimenId === 'cheek' && (
                    <g>
                      {[
                        { cx: 110, cy: 120, r: 34 },
                        { cx: 195, cy: 145, r: 36 },
                        { cx: 145, cy: 205, r: 32 },
                        { cx: 225, cy: 85, r: 30 },
                        { cx: 80, cy: 210, r: 31 },
                      ].map((cell, idx) => (
                        <g key={idx}>
                          <path
                            d={`M ${cell.cx - cell.r} ${cell.cy} Q ${cell.cx - cell.r * 0.6} ${
                              cell.cy - cell.r * 1.05
                            } ${cell.cx} ${cell.cy - cell.r * 0.85} Q ${cell.cx + cell.r * 1.1} ${
                              cell.cy - cell.r * 0.6
                            } ${cell.cx + cell.r * 0.9} ${cell.cy + cell.r * 0.2} Q ${
                              cell.cx + cell.r * 0.6
                            } ${cell.cy + cell.r} ${cell.cx - cell.r * 0.2} ${
                              cell.cy + cell.r * 0.9
                            } Q ${cell.cx - cell.r * 1.05} ${cell.cy + cell.r * 0.55} ${
                              cell.cx - cell.r
                            } ${cell.cy} Z`}
                            fill={stained ? '#93C5FD' : '#E2E8F0'}
                            fillOpacity={stained ? '0.58' : '0.3'}
                            stroke={stained ? '#1D4ED8' : '#94A3B8'}
                            strokeWidth="1.6"
                          />
                          <circle
                            cx={cell.cx + 4}
                            cy={cell.cy - 2}
                            r="6.5"
                            fill={stained ? '#1E3A8A' : '#94A3B8'}
                            fillOpacity={stained ? '0.88' : '0.35'}
                          />
                        </g>
                      ))}
                    </g>
                  )}

                  {specimenId === 'rootTip' && (
                    <g>
                      {[0, 1, 2, 3, 4].map((row) =>
                        [0, 1, 2, 3, 4].map((col) => {
                          const x = 35 + col * 50;
                          const y = 35 + row * 50;
                          const isMitosis = (row + col) % 3 === 0;
                          return (
                            <g key={`${row}-${col}`}>
                              <rect
                                x={x}
                                y={y}
                                width="46"
                                height="46"
                                rx="3"
                                fill={stained ? '#DDD6FE' : '#F1F5F9'}
                                fillOpacity={stained ? '0.65' : '0.3'}
                                stroke={stained ? '#4C1D95' : '#94A3B8'}
                                strokeWidth="1.8"
                              />
                              {isMitosis ? (
                                <g stroke={stained ? '#312E81' : '#94A3B8'} strokeWidth="2.2">
                                  <line x1={x + 15} y1={y + 16} x2={x + 31} y2={y + 20} />
                                  <line x1={x + 16} y1={y + 26} x2={x + 30} y2={y + 22} />
                                  <line x1={x + 18} y1={y + 32} x2={x + 28} y2={y + 29} />
                                </g>
                              ) : (
                                <circle
                                  cx={x + 23}
                                  cy={y + 23}
                                  r="8"
                                  fill={stained ? '#4338CA' : '#94A3B8'}
                                  fillOpacity={stained ? '0.75' : '0.3'}
                                />
                              )}
                            </g>
                          );
                        })
                      )}
                    </g>
                  )}

                  {/* Air bubble warning artifact if coverslip wasn't lowered yet */}
                  {!coverslipAdded && (
                    <circle
                      cx="205"
                      cy="118"
                      r="26"
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="3.5"
                      strokeOpacity="0.65"
                    />
                  )}
                </g>
              </svg>
            )}

            {/* Eyepiece Graticule Scale Overlay */}
            {showGraticule && slidePlaced && (
              <svg
                viewBox="0 0 320 320"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <line x1="40" y1="160" x2="280" y2="160" stroke="#0F172A" strokeWidth="1" strokeOpacity="0.7" />
                {Array.from({ length: 25 }).map((_, idx) => {
                  const x = 40 + idx * 10;
                  const major = idx % 5 === 0;
                  return (
                    <line
                      key={idx}
                      x1={x}
                      y1={major ? 151 : 155}
                      x2={x}
                      y2={major ? 169 : 165}
                      stroke="#0F172A"
                      strokeWidth={major ? '1.2' : '0.8'}
                      strokeOpacity="0.75"
                    />
                  );
                })}
                <text x="160" y="186" textAnchor="middle" className="fill-slate-900 text-[10px] font-mono">
                  Scale bar: 1 cell image = {trueImageMm.toFixed(1)} mm at {totalMag}×
                </text>
              </svg>
            )}
          </div>

          <div className="mt-3 flex w-full items-center justify-between text-xs text-slate-400">
            <span>{!coverslipAdded && slidePlaced ? 'Tip: Lower coverslip to remove air bubble' : 'Eyepiece: 10×'}</span>
            <label className="flex cursor-pointer items-center gap-1.5 text-slate-300">
              <input
                type="checkbox"
                checked={showGraticule}
                onChange={(e) => setShowGraticule(e.target.checked)}
                className="rounded border-slate-500"
              />
              Show eyepiece scale
            </label>
          </div>
        </div>

        {/* Microscope Controls */}
        <div className="flex flex-col justify-between space-y-4 rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-semibold text-slate-700">
                Objective Lens Turret (×10 eyepiece fixed)
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([4, 10, 40] as const).map((mag) => (
                  <button
                    key={mag}
                    type="button"
                    onClick={() => setObjectiveMag(mag)}
                    className={`rounded-lg border py-2 text-xs font-mono font-semibold transition-colors ${
                      objectiveMag === mag
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ×{mag} ({mag * 10}×)
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="coarse-focus" className="font-medium text-slate-700">
                  Coarse Focus Dial
                </label>
                <span className="font-mono text-slate-600">{coarseFocus} / 100</span>
              </div>
              <input
                id="coarse-focus"
                type="range"
                min={0}
                max={100}
                step={1}
                value={coarseFocus}
                onChange={(e) => handleCoarseChange(Number(e.target.value))}
                className="mt-1.5 w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="fine-focus" className="font-medium text-slate-700">
                  Fine Focus Dial
                </label>
                <span className="font-mono text-slate-600">{fineFocus} / 100</span>
              </div>
              <input
                id="fine-focus"
                type="range"
                min={0}
                max={100}
                step={1}
                value={fineFocus}
                onChange={(e) => handleFineChange(Number(e.target.value))}
                className="mt-1.5 w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="condenser-light" className="font-medium text-slate-700">
                  Stage Illumination
                </label>
                <span className="font-mono text-slate-600">{lightLevel}%</span>
              </div>
              <input
                id="condenser-light"
                type="range"
                min={30}
                max={100}
                step={5}
                value={lightLevel}
                onChange={(e) => setLightLevel(Number(e.target.value))}
                className="mt-1.5 w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Measurement & Record Box */}
          <div className="border-t border-slate-200 pt-4">
            <label htmlFor="measured-image-mm" className="block text-xs font-semibold text-slate-800">
              Measured Cell Image Size (mm)
            </label>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Read from the eyepiece scale ({trueImageMm.toFixed(1)} mm when focused) to calculate actual size.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="measured-image-mm"
                type="number"
                step="0.1"
                min="0.1"
                placeholder={trueImageMm.toFixed(1)}
                value={studentImageMm}
                onChange={(e) => setStudentImageMm(e.target.value)}
                className="w-28 rounded-lg border border-slate-300 px-2.5 py-2 font-mono text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRecordObservation}
                className="flex-1 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-teal-800"
              >
                Record Measurement
              </button>
            </div>
            {recordFeedback && (
              <p className="mt-2 text-xs text-teal-800" role="status">
                {recordFeedback}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
