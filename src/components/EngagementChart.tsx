"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartDataPoint = Record<string, any> & { label: string };

interface DataSeries {
  key: string;
  name: string;
  color: string;
}

interface EngagementChartProps {
  title: string;
  data: ChartDataPoint[];
  series: DataSeries[];
  type?: "bar" | "line";
  height?: number;
}

export function EngagementChart({
  title,
  data,
  series,
  type = "bar",
  height = 350,
}: EngagementChartProps) {
  const Chart = type === "line" ? LineChart : BarChart;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <Chart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000000
                  ? `${(v / 1000000).toFixed(1)}M`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}K`
                    : String(v)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 10%)",
                border: "1px solid hsl(0 0% 20%)",
                borderRadius: "8px",
                color: "hsl(0 0% 90%)",
              }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Legend />
            {series.map((s) =>
              type === "line" ? (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                />
              )
            )}
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
