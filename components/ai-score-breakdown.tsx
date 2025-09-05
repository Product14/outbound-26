"use client"

import React from 'react'
import { X, CheckCircle, AlertCircle, TrendingUp, MessageSquare, Clock, Heart, Brain, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CircularProgress } from "@/components/ui/circular-progress"
import type { CallRecord } from "@/types/call-record"

interface AIScoreBreakdownProps {
  call: CallRecord | null
  open: boolean
  onClose: () => void
}

interface ScoreCategory {
  name: string
  score: number
  icon: React.ReactNode
  color: string
  strengths: string[]
  improvements: string[]
}

export function AIScoreBreakdown({ call, open, onClose }: AIScoreBreakdownProps) {
  if (!call || !open) return null

  // Generate detailed score breakdown based on call data
  const generateScoreBreakdown = (call: CallRecord): ScoreCategory[] => {
    const baseScore = call.ai_score || 7.5
    
    return [
      {
        name: "Communication Skills",
        score: Math.min(10, baseScore + (call.sentiment.label === "positive" ? 1.5 : call.sentiment.label === "negative" ? -2 : 0)),
        icon: <MessageSquare className="h-4 w-4" />,
        color: "blue",
        strengths: (() => {
          const strengths = []
          if (call.sentiment.label === "positive") {
            strengths.push("Maintained positive tone throughout the call")
          }
          if (call.ai_score >= 8) {
            strengths.push("Clear articulation of information")
          }
          if (call.containment) {
            strengths.push("Successfully addressed customer concerns")
          }
          return strengths
        })(),
        improvements: (() => {
          const improvements = []
          if (call.sentiment.label === "negative") {
            improvements.push("Could improve empathy and active listening")
          }
          if (call.ai_score < 7) {
            improvements.push("Consider using more personalized language")
          }
          if (call.outcome === "transferred_to_human") {
            improvements.push("Could have attempted additional resolution steps")
          }
          return improvements
        })()
      },
      {
        name: "Problem Solving",
        score: Math.min(10, baseScore + (call.containment ? 2 : -1) + (call.outcome === "appointment_scheduled" ? 1 : 0)),
        icon: <Brain className="h-4 w-4" />,
        color: "green",
        strengths: (() => {
          const strengths = []
          if (call.containment) {
            strengths.push("Successfully resolved customer query without escalation")
          }
          if (call.outcome === "appointment_scheduled") {
            strengths.push("Effectively converted inquiry into appointment")
          }
          if (call.ai_score >= 8) {
            strengths.push("Followed proper diagnostic procedures")
          }
          return strengths
        })(),
        improvements: (() => {
          const improvements = []
          if (!call.containment && call.ai_score < 7) {
            improvements.push("Could have explored more solution options before escalating")
          }
          if (call.ai_score < 6) {
            improvements.push("Consider proactive follow-up suggestions")
          }
          if (call.domain === "sales" && call.ai_score < 8) {
            improvements.push("Could have identified additional sales opportunities")
          }
          return improvements
        })()
      }
    ]
  }

  const scoreCategories = generateScoreBreakdown(call)
  const overallScore = call.ai_score || 7.5
  const overallGrade = overallScore >= 9 ? "Excellent" : overallScore >= 8 ? "Very Good" : overallScore >= 7 ? "Good" : overallScore >= 6 ? "Fair" : "Needs Improvement"

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-emerald-600"
    if (score >= 8) return "text-green-600"
    if (score >= 7) return "text-blue-600"
    if (score >= 6) return "text-amber-600"
    if (score >= 4) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBackground = (score: number) => {
    if (score >= 9) return "bg-emerald-50 border-emerald-200"
    if (score >= 8) return "bg-green-50 border-green-200"
    if (score >= 7) return "bg-blue-50 border-blue-200"
    if (score >= 6) return "bg-amber-50 border-amber-200"
    if (score >= 4) return "bg-orange-50 border-orange-200"
    return "bg-red-50 border-red-200"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-3 text-xl font-bold">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              AI Performance Analysis
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Overall Score Summary */}
          <Card className={`${getScoreBackground(overallScore)} border-2 mb-6`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall AI Score</span>
                <span className={`font-semibold ${getScoreColor(overallScore)}`}>
                  {overallGrade}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <CircularProgress
                    value={overallScore * 10}
                    size={120}
                    strokeWidth={10}
                    showValue={true}
                    valueClassName={getScoreColor(overallScore)}
                    animationDuration={1500}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {call.domain === "sales" ? "Sales" : "Service"} call lasting {Math.round(call.metrics.duration_sec / 60)} minutes, 
                    resulting in {call.outcome.replace(/_/g, ' ')} with {call.sentiment.label} customer sentiment.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Performance:</span>
                    <Badge variant="outline" className={`${getScoreColor(overallScore)} px-2 py-1`}>
                      {overallGrade}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scoreCategories.map((category, index) => (
              <Card key={index} className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className={`p-1 rounded-full bg-${category.color}-100 text-${category.color}-600`}>
                      {category.icon}
                    </div>
                    <span className="flex-1">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <CircularProgress
                        value={category.score * 10}
                        size={40}
                        strokeWidth={4}
                        className="flex-shrink-0"
                      >
                        <div className="text-xs font-bold text-gray-700">
                          {category.score.toFixed(1)}
                        </div>
                      </CircularProgress>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* What Agent Did Well - only show if there are strengths */}
                  {category.strengths && category.strengths.filter(item => item && item.trim().length > 0).length > 0 && (
                    <div className="border-l-4 border-emerald-500 bg-emerald-50/80 rounded-r-lg p-4">
                      <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5" />
                        What Agent Did Well
                      </div>
                      <div className="space-y-2">
                        {category.strengths.filter(item => item && item.trim().length > 0).map((strength, idx) => (
                          <div key={idx} className="text-sm text-gray-900 leading-relaxed flex items-start gap-2">
                            <span className="text-emerald-700 mt-0 text-xs">•</span>
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Areas for Improvement - only show if there are improvements */}
                  {category.improvements && category.improvements.filter(item => item && item.trim().length > 0).length > 0 && (
                    <div className="border-l-4 border-amber-500 bg-amber-50/80 rounded-r-lg p-4">
                      <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Areas for Improvement
                      </div>
                      <div className="space-y-2">
                        {category.improvements.filter(item => item && item.trim().length > 0).map((improvement, idx) => (
                          <div key={idx} className="text-sm text-gray-900 leading-relaxed flex items-start gap-2">
                            <span className="text-amber-700 mt-0 text-xs">•</span>
                            <span>{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Items */}
          <Card className="border-blue-200 bg-blue-50 mt-6">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-700 mb-2">For Agent Development:</p>
                  <ul className="space-y-1 text-blue-600 list-disc ml-4">
                    <li>Review call recording for tone and pacing</li>
                    <li>Practice active listening techniques</li>
                    <li>{call.domain === "sales" ? "Study product knowledge materials" : "Review service procedures"}</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-blue-700 mb-2">For Management:</p>
                  <ul className="space-y-1 text-blue-600 list-disc ml-4">
                    <li>Consider additional training in low-scoring areas</li>
                    <li>Share best practices from high-performing calls</li>
                    <li>Schedule coaching session if overall score &lt; 7.0</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}