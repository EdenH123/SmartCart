'use client';

import { useState } from 'react';
import type { CostHistory } from '@/types';

interface CostHistoryChartProps {
  data: CostHistory;
}

export default function CostHistoryChart({ data }: CostHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.points.length < 2) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
        אין מספיק נתונים להצגת היסטוריה
      </div>
    );
  }

  const { points } = data;

  const allCosts = points.map((p) => p.cheapestTotal);
  const minCost = Math.min(...allCosts);
  const maxCost = Math.max(...allCosts);

  const costPad = (maxCost - minCost) * 0.15 || 1;
  const yMin = minCost - costPad;
  const yMax = maxCost + costPad;

  // Chart dimensions within the viewBox
  const viewW = 600;
  const viewH = 220;
  const padLeft = 60;
  const padRight = 15;
  const padTop = 20;
  const padBottom = 35;
  const chartW = viewW - padLeft - padRight;
  const chartH = viewH - padTop - padBottom;

  function toX(index: number): number {
    const count = points.length;
    if (count === 1) return padLeft + chartW / 2;
    return padLeft + (index / (count - 1)) * chartW;
  }

  function toY(cost: number): number {
    return padTop + chartH - ((cost - yMin) / (yMax - yMin)) * chartH;
  }

  // Y-axis ticks
  const yTickCount = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push(yMin + (i / yTickCount) * (yMax - yMin));
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  // X-axis: show up to 7 labels evenly spaced
  const maxXLabels = 7;
  const xLabelStep = Math.max(1, Math.floor(points.length / maxXLabels));
  const xLabelIndices: number[] = [];
  for (let i = 0; i < points.length; i += xLabelStep) {
    xLabelIndices.push(i);
  }
  // Always include the last point
  if (xLabelIndices[xLabelIndices.length - 1] !== points.length - 1) {
    xLabelIndices.push(points.length - 1);
  }

  // Build line path
  const pathD = points
    .map((p, i) => {
      const x = toX(i);
      const y = toY(p.cheapestTotal);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Build area path (fill under the line)
  const areaD = `${pathD} L ${toX(points.length - 1)} ${padTop + chartH} L ${toX(0)} ${padTop + chartH} Z`;

  const brandGreen = '#25a768';
  const brandGreenLight = '#25a76820';

  return (
    <div className="w-full relative">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full"
        style={{ height: 220 }}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`grid-${i}`}
            x1={padLeft}
            x2={viewW - padRight}
            y1={toY(tick)}
            y2={toY(tick)}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={`y-${i}`}
            x={padLeft - 5}
            y={toY(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            ₪{tick.toFixed(1)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabelIndices.map((idx) => (
          <text
            key={`x-${idx}`}
            x={toX(idx)}
            y={viewH - 5}
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            {formatDate(points[idx].date)}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaD} fill={brandGreenLight} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={brandGreen} strokeWidth="2.5" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => {
          const x = toX(i);
          const y = toY(p.cheapestTotal);
          const isHovered = hoveredIndex === i;
          return (
            <g key={i}>
              {/* Invisible larger hit area */}
              <circle
                cx={x}
                cy={y}
                r={14}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
              />
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3}
                fill={isHovered ? brandGreen : '#fff'}
                stroke={brandGreen}
                strokeWidth={isHovered ? 0 : 2}
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredIndex !== null && (() => {
          const p = points[hoveredIndex];
          const x = toX(hoveredIndex);
          const y = toY(p.cheapestTotal);

          const tooltipW = 150;
          const tooltipH = 52;
          // Flip tooltip left/right to stay in bounds
          let tx = x - tooltipW / 2;
          if (tx < padLeft) tx = padLeft;
          if (tx + tooltipW > viewW - padRight) tx = viewW - padRight - tooltipW;
          const ty = y - tooltipH - 12;

          return (
            <g>
              <line x1={x} x2={x} y1={y + 5} y2={padTop + chartH} stroke={brandGreen} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <rect x={tx} y={ty} width={tooltipW} height={tooltipH} rx="6" fill="#1f2937" opacity="0.95" />
              <text x={tx + tooltipW / 2} y={ty + 18} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">
                ₪{p.cheapestTotal.toFixed(2)}
              </text>
              <text x={tx + tooltipW / 2} y={ty + 34} textAnchor="middle" fontSize="10" fill="#9ca3af">
                {p.supermarketName}
              </text>
              <text x={tx + tooltipW / 2} y={ty + 47} textAnchor="middle" fontSize="9" fill="#6b7280">
                {formatDate(p.date)}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
