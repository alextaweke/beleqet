// components/analytics/BarChart.tsx
"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: { label: string; count: number }[];
  color?: string;
  height?: number;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  color = "#3b82f6",
  height = 300,
  horizontal = false,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis
              dataKey="label"
              type="category"
              stroke="#9ca3af"
              fontSize={12}
              width={100}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Bar
          dataKey="count"
          fill={color}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          maxBarSize={50}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
