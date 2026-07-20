// components/analytics/LineChart.tsx
"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineChartProps {
  data: { date: string; count: number; sum?: number }[];
  dataKey?: string;
  color?: string;
  height?: number;
  showSum?: boolean;
}

export default function LineChart({
  data,
  dataKey = "count",
  color = "#22c55e",
  height = 300,
  showSum = false,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
          name={showSum ? "Count" : "Count"}
        />
        {showSum && data[0]?.sum !== undefined && (
          <Line
            type="monotone"
            dataKey="sum"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            name="Amount"
          />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
