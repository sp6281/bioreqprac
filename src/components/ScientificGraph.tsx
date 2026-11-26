import React from 'react';
import type { GraphConfig, RecordedRow } from '../types/lab';
import { estimateIsotonicConcentration } from '../sim/biologyMath';

interface ScientificGraphProps {
  config: GraphConfig;
  rows: RecordedRow[];
  title?: string;
}

export const ScientificGraph: React.FC<ScientificGraphProps> = ({ config, rows, title }) => {
  const validRows = rows.filter((r) => !r.anomaly);

  if (validRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
        <p className="text-sm font-medium text-slate-700">No plotted data yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Record measurements from the laboratory apparatus to generate a live scientific graph.
        </p>
      </div>
    );
  }

  const W = 480;
  const H = 264;
  const padL = 56;
  const padR = 36;
  const padT = 22;
  const padB = 46;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (config.chartType === 'bar') {
    // Group by category xKey and average yKey
    const groups = new Map<string, number[]>();
    for (const row of validRows) {
      const cat = String(row.values[config.xKey] ?? '');
      const y = Number(row.values[config.yKey]);
      if (!Number.isFinite(y)) continue;
      const list = groups.get(cat) ?? [];
      list.push(y);
      groups.set(cat, list);
    }

    const entries = Array.from(groups.entries()).map(([label, vals]) => ({
      label,
      mean: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
      n: vals.length,
    }));

    if (entries.length === 0) {
      return null;
    }

    const rawMaxY = Math.max(10, ...entries.map((e) => e.mean)) * 1.15;
    const niceStepY = rawMaxY <= 20 ? 5 : rawMaxY <= 50 ? 10 : rawMaxY <= 120 ? 25 : rawMaxY <= 300 ? 50 : 150;
    const maxY = Math.ceil(rawMaxY / niceStepY) * niceStepY;
    const yTicks: number[] = [];
    for (let v = 0; v <= maxY + 0.001; v += niceStepY) {
      yTicks.push(Math.round(v));
    }
    const slotW = innerW / entries.length;
    const barW = Math.min(54, slotW * 0.56);

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        {title && (
          <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium text-slate-800">{title}</span>
            <span className="font-mono text-[11px] text-slate-500">Mean per category</span>
          </div>
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`${config.yLabel} by ${config.xLabel} bar chart`}
        >
          {/* Horizontal gridlines & Y ticks */}
          {yTicks.map((tick, idx) => {
            const yPos = padT + innerH - (tick / maxY) * innerH;
            return (
              <g key={idx}>
                <line
                  x1={padL}
                  y1={yPos}
                  x2={W - padR}
                  y2={yPos}
                  stroke="#E2E8F0"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={padL - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#64748B" strokeWidth="1.2" />
          <line
            x1={padL}
            y1={padT + innerH}
            x2={W - padR}
            y2={padT + innerH}
            stroke="#64748B"
            strokeWidth="1.2"
          />

          {/* Bars */}
          {entries.map((entry, idx) => {
            const cx = padL + slotW * idx + slotW / 2;
            const bh = (entry.mean / maxY) * innerH;
            const yTop = padT + innerH - bh;
            const shortLabel =
              entry.label.length > 15 ? entry.label.slice(0, 14) + '…' : entry.label;
            return (
              <g key={entry.label}>
                <rect
                  x={cx - barW / 2}
                  y={yTop}
                  width={barW}
                  height={Math.max(1, bh)}
                  rx="3"
                  fill="#0F766E"
                  fillOpacity="0.88"
                />
                <text
                  x={cx}
                  y={yTop - 5}
                  textAnchor="middle"
                  className="fill-slate-800 text-[10px] font-mono font-semibold"
                >
                  {entry.mean}
                </text>
                <text
                  x={cx}
                  y={padT + innerH + 15}
                  textAnchor="middle"
                  className="fill-slate-600 text-[10px]"
                >
                  {shortLabel}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padL + innerW / 2}
            y={H - 8}
            textAnchor="middle"
            className="fill-slate-700 text-[11px] font-medium"
          >
            {config.xLabel}
          </text>
          <text
            x={14}
            y={padT + innerH / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${padT + innerH / 2})`}
            className="fill-slate-700 text-[11px] font-medium"
          >
            {config.yLabel}
          </text>
        </svg>
      </div>
    );
  }

  // Scatter + Line chart
  const pts = validRows
    .map((r) => ({
      x: Number(r.values[config.xKey]),
      y: Number(r.values[config.yKey]),
    }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

  if (pts.length === 0) return null;

  // Average duplicate x values for smooth connecting curve
  const groupedX = new Map<number, number[]>();
  for (const p of pts) {
    const arr = groupedX.get(p.x) ?? [];
    arr.push(p.y);
    groupedX.set(p.x, arr);
  }
  const curvePts = Array.from(groupedX.entries())
    .map(([x, ys]) => ({ x, y: ys.reduce((a, b) => a + b, 0) / ys.length }))
    .sort((a, b) => a.x - b.x);

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);

  // Clean nice rounded bounds for X axis
  const rawMaxX = Math.max(...xs);
  const rawMinX = Math.min(0, ...xs);
  const xStep = rawMaxX <= 1.0 ? 0.2 : rawMaxX <= 12 ? 2 : rawMaxX <= 60 ? 10 : 20;
  const minX = Math.floor(rawMinX / xStep) * xStep;
  const maxX = Math.max(minX + xStep, Math.ceil((rawMaxX + xStep * 0.05) / xStep) * xStep);

  // Clean nice rounded bounds for Y axis
  const rawMinY = Math.min(0, ...ys);
  const rawMaxY = Math.max(0, ...ys);
  const spanY = Math.max(10, rawMaxY - rawMinY);
  const yStep = spanY <= 25 ? 5 : spanY <= 60 ? 10 : spanY <= 120 ? 20 : 50;
  const minY = rawMinY < 0 ? Math.floor((rawMinY - yStep * 0.2) / yStep) * yStep : 0;
  const maxY = Math.ceil((rawMaxY + yStep * 0.35) / yStep) * yStep;

  const mapX = (x: number) => padL + ((x - minX) / (maxX - minX)) * innerW;
  const mapY = (y: number) => padT + innerH - ((y - minY) / (maxY - minY)) * innerH;

  const yTicks: number[] = [];
  for (let v = minY; v <= maxY + 0.0001; v += yStep) {
    yTicks.push(Number(v.toFixed(1)));
  }
  const xTicks: number[] = [];
  for (let v = minX; v <= maxX + 0.0001; v += xStep) {
    xTicks.push(Number(v.toFixed(1)));
  }

  const pathD = curvePts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`)
    .join(' ');

  const isotonicX = config.showIsotonicIntercept
    ? estimateIsotonicConcentration(
        curvePts.map((p) => ({ concentration: p.x, percentChange: p.y }))
      )
    : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-800">{title ?? 'Live Experimental Graph'}</span>
        {isotonicX !== null && (
          <span className="font-mono text-[11px] font-medium text-teal-700">
            Isotonic point ≈ {isotonicX.toFixed(2)} mol/dm³
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={`${config.yLabel} versus ${config.xLabel} graph`}
      >
        {/* Gridlines */}
        {yTicks.map((tick, i) => {
          const yPos = mapY(tick);
          return (
            <g key={`y-${i}`}>
              <line
                x1={padL}
                y1={yPos}
                x2={W - padR}
                y2={yPos}
                stroke={tick === 0 && config.showZeroLine ? '#475569' : '#E2E8F0'}
                strokeWidth={tick === 0 && config.showZeroLine ? '1.2' : '1'}
                strokeDasharray={tick === 0 && config.showZeroLine ? '4 2' : '3 3'}
              />
              <text
                x={padL - 8}
                y={yPos + 3.5}
                textAnchor="end"
                className={`text-[10px] font-mono ${
                  tick === 0 && config.showZeroLine ? 'fill-slate-800 font-semibold' : 'fill-slate-500'
                }`}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {xTicks.map((tick, i) => {
          const xPos = mapX(tick);
          return (
            <g key={`x-${i}`}>
              <line x1={xPos} y1={padT} x2={xPos} y2={padT + innerH} stroke="#F1F5F9" />
              <text
                x={xPos}
                y={padT + innerH + 15}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                {xStep < 1 ? tick.toFixed(1) : tick}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#64748B" strokeWidth="1.2" />
        <line
          x1={padL}
          y1={padT + innerH}
          x2={W - padR}
          y2={padT + innerH}
          stroke="#64748B"
          strokeWidth="1.2"
        />

        {/* Line of best fit / trendline */}
        {curvePts.length >= 2 && (
          <path d={pathD} fill="none" stroke="#0F766E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Isotonic vertical drop marker */}
        {isotonicX !== null && (
          <g>
            <line
              x1={mapX(isotonicX)}
              y1={mapY(0)}
              x2={mapX(isotonicX)}
              y2={padT + innerH}
              stroke="#D97706"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <circle cx={mapX(isotonicX)} cy={mapY(0)} r="4" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )}

        {/* Data points */}
        {pts.map((p, idx) => (
          <circle
            key={idx}
            cx={mapX(p.x)}
            cy={mapY(p.y)}
            r="4.2"
            fill="#0F766E"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}

        {/* Axis labels */}
        <text
          x={padL + innerW / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-slate-700 text-[11px] font-medium"
        >
          {config.xLabel}
        </text>
        <text
          x={14}
          y={padT + innerH / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${padT + innerH / 2})`}
          className="fill-slate-700 text-[11px] font-medium"
        >
          {config.yLabel}
        </text>
      </svg>
    </div>
  );
};
