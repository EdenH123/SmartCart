'use client';

import type { PriceHistoryData } from '@/types';

const SUPERMARKET_COLORS: Record<string, string> = {
  'שופרסל': '#e31e24',
  'Shufersal': '#e31e24',
  'רמי לוי': '#003da5',
  'Rami Levy': '#003da5',
  'יוחננוף': '#00a651',
  'Yochananof': '#00a651',
};

const FALLBACK_COLORS = ['#e31e24', '#003da5', '#00a651', '#f59e0b', '#8b5cf6', '#ec4899'];

function getColor(name: string, index: number): string {
  return SUPERMARKET_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

interface PriceHistoryChartProps {
  data: PriceHistoryData;
}

export default function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const hasData = data.some((s) => s.data.length > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
        אין היסטוריית מחירים
      </div>
    );
  }

  // Collect all points to determine axis bounds
  const allPrices: number[] = [];
  const allDates: number[] = [];

  for (const series of data) {
    for (const point of series.data) {
      allPrices.push(point.price);
      allDates.push(new Date(point.date).getTime());
    }
  }

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);

  // Add padding to price range
  const pricePad = (maxPrice - minPrice) * 0.1 || 1;
  const yMin = minPrice - pricePad;
  const yMax = maxPrice + pricePad;

  // Chart dimensions within the viewBox
  const viewW = 600;
  const viewH = 200;
  const padLeft = 55;
  const padRight = 10;
  const padTop = 15;
  const padBottom = 30;
  const chartW = viewW - padLeft - padRight;
  const chartH = viewH - padTop - padBottom;

  const dateRange = maxDate - minDate || 1;

  function toX(timestamp: number): number {
    return padLeft + ((timestamp - minDate) / dateRange) * chartW;
  }

  function toY(price: number): number {
    return padTop + chartH - ((price - yMin) / (yMax - yMin)) * chartH;
  }

  // Y-axis ticks (3-5 ticks)
  const yTickCount = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push(yMin + (i / yTickCount) * (yMax - yMin));
  }

  // X-axis ticks (up to 5 date labels)
  const xTickCount = Math.min(5, new Set(allDates).size);
  const xTicks: number[] = [];
  for (let i = 0; i < xTickCount; i++) {
    xTicks.push(minDate + (i / (xTickCount - 1 || 1)) * dateRange);
  }

  function formatDate(ts: number): string {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full"
        style={{ height: 200 }}
        preserveAspectRatio="xMidYMid meet"
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
        {xTicks.map((tick, i) => (
          <text
            key={`x-${i}`}
            x={toX(tick)}
            y={viewH - 5}
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            {formatDate(tick)}
          </text>
        ))}

        {/* Lines and points per series */}
        {data.map((series, si) => {
          if (series.data.length === 0) return null;
          const color = getColor(series.supermarketName, si);

          // Sort by date ascending for proper line drawing
          const sorted = [...series.data].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          const pathD = sorted
            .map((p, i) => {
              const x = toX(new Date(p.date).getTime());
              const y = toY(p.price);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');

          return (
            <g key={si}>
              <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
              {sorted.map((p, pi) => {
                const x = toX(new Date(p.date).getTime());
                const y = toY(p.price);
                return (
                  <circle
                    key={pi}
                    cx={x}
                    cy={y}
                    r={p.isPromo ? 4 : 2.5}
                    fill={p.isPromo ? color : '#fff'}
                    stroke={color}
                    strokeWidth={p.isPromo ? 0 : 1.5}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-2">
        {data
          .filter((s) => s.data.length > 0)
          .map((series, i) => {
            const color = getColor(series.supermarketName, i);
            return (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {series.supermarketName}
              </div>
            );
          })}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-400" />
          = מבצע
        </div>
      </div>
    </div>
  );
}
