// components/analytics/PieChart.tsx
"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLOR_PALETTE } from "@/lib/analytics";

interface PieChartProps {
  data: { label: string; count: number }[];
  height?: number;
  showLabel?: boolean;
}

export default function PieChart({
  data,
  height = 300,
  showLabel = true,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        No data available
      </div>
    );
  }

  const colors = CHART_COLOR_PALETTE.slice(0, data.length);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={
            showLabel
              ? ({ name, percent }) =>
                  `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`
              : false
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
