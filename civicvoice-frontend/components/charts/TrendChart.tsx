import { Sparkline } from './Sparkline';

type TrendChartProps = {
  values: number[];
  label: string;
};

export function TrendChart({ values, label }: TrendChartProps) {
  return (
    <div className="cv-trend-chart">
      <Sparkline values={values} />
      <span className="cv-trend-chart__label">{label}</span>
    </div>
  );
}


