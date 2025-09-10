'use client'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface PerformanceTimeData {
  hour: string;
  calls: number;
  appointments: number;
  successRate: number;
}

interface PerformanceTimeChartProps {
  data: PerformanceTimeData[];
  title?: string;
}

const chartConfig = {
  calls: {
    label: "Calls",
    color: "#3B82F6",
  },
  appointments: {
    label: "Appointments",
    color: "#10B981",
  },
}

export function PerformanceTimeChart({ data, title = "Best Campaign Performance Time" }: PerformanceTimeChartProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">
          {title}
        </h3>
      </div>
      
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 0,
              left: -5,
              bottom: 2,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="hour" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6B7280" }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              width={35}
            />
            <ChartTooltip
              formatter={(value, name) => [
                value,
                name === "calls" ? "Calls" : "Appointments"
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Bar
              dataKey="calls"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Bar
              dataKey="appointments"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Peak performance metrics below the chart */}
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div className="text-center p-1 bg-[#F0FDF4] rounded-[8px]">
            <div className="text-[14px] font-bold text-[#10B981] mb-1">
              {(() => {
                const peakConversion = data.reduce((max, item) => 
                  item.successRate > max.successRate ? item : max
                );
                return peakConversion.hour;
              })()}
            </div>
            <div className="text-xs text-[#6B7280] mb-0.5">Peak Conversion Time</div>
            <div className="text-xs text-[#10B981] font-medium">
              {(() => {
                const peakConversion = data.reduce((max, item) => 
                  item.successRate > max.successRate ? item : max
                );
                return `${peakConversion.successRate}% success rate`;
              })()}
            </div>
          </div>
          <div className="text-center p-1 bg-[#F8FAFC] rounded-[8px]">
            <div className="text-[14px] font-bold text-[#3B82F6] mb-1">
              {(() => {
                const peakCalls = data.reduce((max, item) => 
                  item.calls > max.calls ? item : max
                );
                return peakCalls.hour;
              })()}
            </div>
            <div className="text-xs text-[#6B7280] mb-0.5">Peak Call Time</div>
            <div className="text-xs text-[#3B82F6] font-medium">
              {(() => {
                const peakCalls = data.reduce((max, item) => 
                  item.calls > max.calls ? item : max
                );
                return `${peakCalls.calls} calls made`;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
