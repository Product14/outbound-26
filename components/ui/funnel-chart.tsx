'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell,
  Tooltip,
  LabelList
} from "recharts"

interface FunnelData {
  stage: string
  value: number
  percentage: number
  color: string
  additionalInfo?: string
}

interface FunnelChartProps {
  data: FunnelData[]
  title?: string
  className?: string
  avgQualityScore?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.stage}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.value.toLocaleString()}</span> calls
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{data.percentage}%</span> rate
        </p>
        {data.additionalInfo && (
          <p className="text-xs text-gray-500 mt-1 italic">
            {data.additionalInfo}
          </p>
        )}
      </div>
    )
  }
  return null
}

const CustomLabel = ({ x, y, width, height, value, payload }: any) => {
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={12}
      fontWeight="600"
    >
      {value.toLocaleString()}
    </text>
  )
}

export function FunnelChart({ data, title = "Campaign Funnel", className, avgQualityScore }: FunnelChartProps) {
  // Calculate the maximum value for proper scaling
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <Card className={`w-full bg-white border border-gray-200 shadow-sm ${className}`}>
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
            >
              <XAxis 
                type="number" 
                domain={[0, maxValue * 1.1]}
                tick={false}
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="stage"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList content={<CustomLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-wrap justify-between items-start gap-6">
            {/* Funnel Metrics */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {data.map((item, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="w-3 h-3 rounded-full mx-auto mb-3"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {item.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">{item.stage}</p>
                    {index > 0 && (
                      <div className="px-2 py-1 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-700">
                          {item.percentage}% rate
                        </p>
                      </div>
                    )}
                    {item.additionalInfo && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {item.additionalInfo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Average Quality Score */}
            {avgQualityScore && (
              <div className="flex-shrink-0 text-center bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Avg Quality Score
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {avgQualityScore.toFixed(1)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  out of 10
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
