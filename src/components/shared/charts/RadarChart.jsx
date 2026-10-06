import { useMemo, useId } from "react";
import * as d3 from "d3";

/**
 * Radar / spider chart for comparing multiple skill dimensions at once.
 * Good for "starting skill levels" (onboarding) and "individual student
 * skill profile" (student dashboard) since it shows the whole competency
 * shape at a glance, not just a single number.
 *
 * props.series: [{ label, color, values: [{ axis, value }] }]
 * props.axes: [{ id, label }] — defines the wheel order
 * props.max: max scale value (default 5)
 */
export default function RadarChart({
  axes,
  series,
  max = 5,
  size = 360,
  levels = 5,
}) {
  const uid = useId();
  const pad = 92;
  const viewSize = size + pad * 2;
  const center = viewSize / 2;
  const radius = size / 2 - 60;

  const angleFor = (i) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;

  const rScale = useMemo(
    () => d3.scaleLinear().domain([0, max]).range([0, radius]),
    [max, radius]
  );

  const pointFor = (i, value) => {
    const angle = angleFor(i);
    const r = rScale(value);
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const lineGen = d3.line();

  const gridLevels = d3.range(1, levels + 1).map((lvl) => {
    const value = (max / levels) * lvl;
    const points = axes.map((_, i) => pointFor(i, value));
    return { value, path: lineGen(points) + "Z" };
  });

  const axisLines = axes.map((axis, i) => {
    const [x, y] = pointFor(i, max);
    return { ...axis, x, y };
  });

  /** Greedily wrap a label into short lines so long skill names (e.g.
   * "Mentorship & Leadership Quotient") don't run off the edge of the chart. */
  function wrapLabel(label, maxChars = 14) {
    const words = label.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  const labelPositions = axes.map((axis, i) => {
    const angle = angleFor(i);
    const labelR = radius + 30;
    const x = center + labelR * Math.cos(angle);
    const y = center + labelR * Math.sin(angle);
    let anchor = "middle";
    if (Math.cos(angle) > 0.25) anchor = "start";
    else if (Math.cos(angle) < -0.25) anchor = "end";
    const lines = wrapLabel(axis.label);
    return { ...axis, x, y, anchor, lines };
  });

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Radar chart comparing skill dimensions"
    >
      <g>
        {gridLevels.map((g) => (
          <path
            key={g.value}
            d={g.path}
            fill="none"
            stroke="var(--purple-100)"
            strokeWidth={1}
          />
        ))}
        {axisLines.map((a) => (
          <line
            key={a.id}
            x1={center}
            y1={center}
            x2={a.x}
            y2={a.y}
            stroke="var(--purple-100)"
            strokeWidth={1}
          />
        ))}
      </g>

      {series.map((s, si) => {
        const points = axes.map((axis, i) => {
          const found = s.values.find((v) => v.axis === axis.id);
          return pointFor(i, found ? found.value : 0);
        });
        const path = lineGen(points) + "Z";
        return (
          <g key={s.label + si}>
            <path
              d={path}
              fill={s.color}
              fillOpacity={0.16}
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {points.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3.5}
                fill={s.color}
                stroke="white"
                strokeWidth={1.5}
              />
            ))}
          </g>
        );
      })}

      {labelPositions.map((l) => {
        const lineHeight = 13;
        const startDy = -((l.lines.length - 1) * lineHeight) / 2;
        return (
          <text
            key={l.id}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill="var(--ink-700)"
          >
            {l.lines.map((line, i) => (
              <tspan key={i} x={l.x} dy={i === 0 ? startDy : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
