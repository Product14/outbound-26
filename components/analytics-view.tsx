"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Clock, Target, Users, Award } from "lucide-react"
import { mockCallRecords } from "@/lib/mock-data"
import { mockAppointments } from "@/lib/mock-appointments"
import { useState } from "react"

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState("7d")

  // Calculate analytics data
  const totalCalls = mockCallRecords.length
  const totalAppointments = mockAppointments.length
  const appointmentConversionRate = Math.round((totalAppointments / totalCalls) * 100)
  const avgCallDuration = Math.round(
    mockCallRecords.reduce((sum, call) => sum + call.metrics.duration_sec, 0) / totalCalls,
  )
  const containmentRate = Math.round((mockCallRecords.filter((call) => call.containment).length / totalCalls) * 100)
  const avgAIScore = Math.round((mockCallRecords.reduce((sum, call) => sum + call.ai_score, 0) / totalCalls) * 10) / 10

  // Domain distribution
  const salesCalls = mockCallRecords.filter((call) => call.domain === "sales").length
  const serviceCalls = mockCallRecords.filter((call) => call.domain === "service").length

  // Outcome distribution
  const outcomeData = [
    {
      name: "Appointment Scheduled",
      value: mockCallRecords.filter((c) => c.outcome === "appointment_scheduled").length,
      color: "#3b82f6",
    },
    {
      name: "Info Provided",
      value: mockCallRecords.filter((c) => c.outcome === "info_provided").length,
      color: "#10b981",
    },
    {
      name: "Transferred",
      value: mockCallRecords.filter((c) => c.outcome === "transferred_to_human").length,
      color: "#f59e0b",
    },
    {
      name: "Other",
      value: mockCallRecords.filter(
        (c) => !["appointment_scheduled", "info_provided", "transferred_to_human"].includes(c.outcome),
      ).length,
      color: "#6b7280",
    },
  ]

  // Daily call volume (mock data for trend)
  const dailyCallData = [
    { date: "Mon", calls: 12, appointments: 4, avgScore: 8.2 },
    { date: "Tue", calls: 15, appointments: 6, avgScore: 7.8 },
    { date: "Wed", calls: 18, appointments: 7, avgScore: 8.5 },
    { date: "Thu", calls: 14, appointments: 5, avgScore: 8.1 },
    { date: "Fri", calls: 20, appointments: 8, avgScore: 8.7 },
    { date: "Sat", calls: 16, appointments: 6, avgScore: 8.3 },
    { date: "Sun", calls: 10, appointments: 3, avgScore: 7.9 },
  ]

  // Quality score distribution
  const qualityScoreData = [
    { range: "9-10", count: mockCallRecords.filter((c) => c.ai_score >= 9).length },
    { range: "8-9", count: mockCallRecords.filter((c) => c.ai_score >= 8 && c.ai_score < 9).length },
    { range: "7-8", count: mockCallRecords.filter((c) => c.ai_score >= 7 && c.ai_score < 8).length },
    { range: "6-7", count: mockCallRecords.filter((c) => c.ai_score >= 6 && c.ai_score < 7).length },
    { range: "Below 6", count: mockCallRecords.filter((c) => c.ai_score < 6).length },
  ]

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h2>
          <p className="text-gray-600">Performance insights and trends</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600 hidden min-[1100px]:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Appointments per Call</div>
            <div className="text-2xl font-bold text-green-600">{appointmentConversionRate}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1 hidden min-[1100px]:inline" />
              +2.3% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-blue-600 hidden min-[1100px]:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Minutes:Seconds</div>
            <div className="text-2xl font-bold">
              {Math.floor(avgCallDuration / 60)}:{(avgCallDuration % 60).toString().padStart(2, "0")}
            </div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <TrendingDown className="h-3 w-3 mr-1 hidden min-[1100px]:inline" />
              -0.5% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Containment Rate</CardTitle>
            <Users className="h-4 w-4 text-purple-600 hidden min-[1100px]:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">AI Handled Calls</div>
            <div className="text-2xl font-bold">{containmentRate}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1 hidden min-[1100px]:inline" />
              +1.2% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Award className="h-4 w-4 text-yellow-600 hidden min-[1100px]:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Out of 10 Points</div>
            <div className="text-2xl font-bold">{avgAIScore}/10</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1 hidden min-[1100px]:inline" />
              +0.3 from last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Call Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Call Volume & Appointments</CardTitle>
            <CardDescription>Call volume and appointment scheduling trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyCallData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#3b82f6" name="Calls" />
                <Bar dataKey="appointments" fill="#10b981" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes Distribution</CardTitle>
            <CardDescription>Breakdown of call results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Score Trend</CardTitle>
            <CardDescription>AI quality scores over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyCallData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" strokeWidth={2} name="Avg Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quality Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Score Distribution</CardTitle>
            <CardDescription>Distribution of AI quality scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={qualityScoreData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Performance</CardTitle>
            <CardDescription>Sales vs Service call performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sales</span>
                <Badge variant="outline" className="text-blue-600">
                  {salesCalls} calls
                </Badge>
              </div>
              <Progress value={(salesCalls / totalCalls) * 100} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((salesCalls / totalCalls) * 100)}% of total calls
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Service</span>
                <Badge variant="outline" className="text-green-600">
                  {serviceCalls} calls
                </Badge>
              </div>
              <Progress value={(serviceCalls / totalCalls) * 100} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((serviceCalls / totalCalls) * 100)}% of total calls
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key metrics overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Calls Handled</span>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">All Time</div>
                <span className="text-lg font-bold">{totalCalls}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Appointments Scheduled</span>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Successfully Booked</div>
                <span className="text-lg font-bold text-green-600">{totalAppointments}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Calls Contained</span>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">AI Resolved</div>
                <span className="text-lg font-bold text-purple-600">
                  {mockCallRecords.filter((c) => c.containment).length}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">High Quality Calls (8+)</span>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Excellent Score</div>
                <span className="text-lg font-bold text-yellow-600">
                  {mockCallRecords.filter((c) => c.ai_score >= 8).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
