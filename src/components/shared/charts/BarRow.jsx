/**
 * Simple animated horizontal bar row — used for onboarding skill levels and
 * any "value out of max" comparison. Deliberately lightweight (no D3 needed)
 * since it's just a proportional fill.
 */
export default function BarRow({
  label,
  value,
  max = 5,
  color = "var(--purple-500)",
  showValue = true,
  trackColor = "var(--purple-50)",
  height = 10,
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar-row">
      <div className="bar-row-label">
        <span>{label}</span>
        {showValue && <span className="bar-row-value">{value.toFixed(1)}</span>}
      </div>
      <div
        className="bar-row-track"
        style={{ background: trackColor, height }}
      >
        <div
          className="bar-row-fill"
          style={{
            width: `${pct}%`,
            background: color,
            height,
          }}
        />
      </div>
    </div>
  );
}
