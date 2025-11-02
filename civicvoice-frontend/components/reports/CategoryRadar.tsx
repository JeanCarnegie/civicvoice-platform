type CategoryRadarProps = {
  values: { label: string; value: number }[];
  max?: number;
  size?: number;
};

export function CategoryRadar({ values, max = 10, size = 320 }: CategoryRadarProps) {
  if (values.length === 0) {
    return null;
  }

  const radius = size / 2 - 24;
  const center = size / 2;

  const toPoint = (value: number, index: number, scale = 1) => {
    const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
    const r = (Math.min(Math.max(value, 0), max) / max) * radius * scale;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const createPolygon = (scale: number) =>
    values
      .map((_, index) => {
        const [x, y] = toPoint(max, index, scale);
        return `${x},${y}`;
      })
      .join(' ');

  const dataPoints = values
    .map((v, index) => {
      const [x, y] = toPoint(v.value, index);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Category averages radar">
      <g fill="none" stroke="var(--cv-color-border)" strokeWidth={1}>
        {[1, 0.66, 0.33].map((scale) => (
          <polygon key={scale} points={createPolygon(scale)} opacity={scale === 1 ? 0.5 : 0.25} />
        ))}
      </g>
      <g stroke="var(--cv-color-border)" strokeWidth={1} opacity={0.4}>
        {values.map((_, index) => {
          const [x, y] = toPoint(max, index, 1);
          return <line key={index} x1={center} y1={center} x2={x} y2={y} />;
        })}
      </g>
      <polygon points={dataPoints} fill="var(--cv-color-primary)" opacity={0.35} stroke="var(--cv-color-primary)" strokeWidth={2} />
      {values.map((item, index) => {
        const [x, y] = toPoint(max, index, 1.08);
        const [dotX, dotY] = toPoint(item.value, index);
        return (
          <g key={item.label}>
            <circle cx={dotX} cy={dotY} r={4} fill="var(--cv-color-primary-strong)" />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="cv-radar-label"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}




