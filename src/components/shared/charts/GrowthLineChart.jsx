import { useMemo, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Multi-series line chart tracking values across program checkpoints
 * (Pre-Program -> Mid-Program -> Final Pitch). Used for skill growth over
 * time, at both the class-wide and individual-student level.
 *
 * props.checkpoints: string[]
 * props.series: [{ id, label, color, values: number[] }]  (values aligned to checkpoints)
 * props.max: y-axis max (default 5)
 */
export default function GrowthLineChart({
  checkpoints,
  series,
  max = 5,
  height = 320,
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hoverIdx, setHoverIdx] = useState(null);

  const margin = { top: 20, right: 24, bottom: 36, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  useMemo(() => {
    if (typeof ResizeObserver === "undefined") return;
  }, []);

  const x = useMemo(
    () =>
      d3
        .scalePoint()
        .domain(checkpoints)
        .range([0, innerW])
        .padding(0.5),
    [checkpoints, innerW]
  );

  const y = useMemo(
    () => d3.scaleLinear().domain([0, max]).range([innerH, 0]),
    [max, innerH]
  );

  const lineGen = useMemo(
    () =>
      d3
        .line()
        .x((d, i) => x(checkpoints[i]))
        .y((d) => y(d))
        .curve(d3.curveMonotoneX),
    [x, y, checkpoints]
  );

  const handleResize = (el) => {
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    if (w && Math.abs(w - width) > 2) setWidth(w);
  };

  const handleMouseMove = (evt) => {
    const rect = evt.currentTarget.getBoundingClientRect();
    const relX = evt.clientX - rect.left - margin.left;
    const step = innerW / (checkpoints.length - 1);
    const idx = Math.round(relX / step);
    setHoverIdx(Math.max(0, Math.min(checkpoints.length - 1, idx)));
  };

  return (
    <div ref={(el) => { containerRef.current = el; handleResize(el); }} style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Line chart showing skill growth across program checkpoints"
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* gridlines */}
          {y.ticks(5).map((t) => (
            <g key={t}>
              <line
                x1={0}
                x2={innerW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--purple-50)"
                strokeWidth={1}
              />
              <text
                x={-10}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--ink-500)"
              >
                {t}
              </text>
            </g>
          ))}

          {/* x axis labels */}
          {checkpoints.map((cp) => (
            <text
              key={cp}
              x={x(cp)}
              y={innerH + 24}
              textAnchor="middle"
              fontSize={12}
              fontWeight={600}
              fill="var(--ink-700)"
            >
              {cp}
            </text>
          ))}

          {/* hover indicator */}
          {hoverIdx != null && (
            <line
              x1={x(checkpoints[hoverIdx])}
              x2={x(checkpoints[hoverIdx])}
              y1={0}
              y2={innerH}
              stroke="var(--purple-200)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {series.map((s) => (
            <g key={s.id}>
              <path
                d={lineGen(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.75}
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(checkpoints[i])}
                  cy={y(v)}
                  r={hoverIdx === i ? 5.5 : 3.5}
                  fill={s.color}
                  stroke="white"
                  strokeWidth={1.5}
                  style={{ transition: "r 0.15s" }}
                />
              ))}
            </g>
          ))}
        </g>
      </svg>

      {hoverIdx != null && (
        <div className="chart-tooltip-row">
          {series.map((s) => (
            <span key={s.id} className="chart-tooltip-item">
              <i style={{ background: s.color }} />
              {s.label}: <strong>{s.values[hoverIdx].toFixed(1)}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
