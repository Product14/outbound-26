'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Phone, Upload, BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp, Users, Calendar, Zap } from 'lucide-react'
import Link from "next/link"

// Mock data for campaigns
const mockCampaigns = [
  {
    id: 'camp_001',
    name: 'Q4 Maintenance Reminders',
    useCase: 'maintenance',
    status: 'Running',
    progress: 65,
    eta: '2 hours',
    callsPlaced: 156,
    answerRate: 68,
    appointmentsBooked: 23,
    createdAt: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'camp_002', 
    name: 'Warranty Expiration Follow-up',
    useCase: 'warranty',
    status: 'Completed',
    progress: 100,
    callsPlaced: 89,
    answerRate: 72,
    appointmentsBooked: 18,
    completedAt: new Date('2024-01-14T16:45:00')
  },
  {
    id: 'camp_003',
    name: 'Seasonal Tire Check',
    useCase: 'seasonal',
    status: 'Completed',
    progress: 100,
    callsPlaced: 234,
    answerRate: 61,
    appointmentsBooked: 31,
    completedAt: new Date('2024-01-12T14:20:00')
  }
]

const useCaseColors: Record<string, string> = {
  recall: 'bg-red-100 text-red-800 border-red-200',
  maintenance: 'bg-blue-100 text-blue-800 border-blue-200',
  warranty: 'bg-orange-100 text-orange-800 border-orange-200',
  'follow-up': 'bg-green-100 text-green-800 border-green-200',
  inspection: 'bg-purple-100 text-purple-800 border-purple-200',
  seasonal: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const statusColors: Record<string, string> = {
  Running: 'bg-blue-100 text-blue-800 border-blue-200',
  Completed: 'bg-green-100 text-green-800 border-green-200',
  Failed: 'bg-red-100 text-red-800 border-red-200'
}

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to setup page as default
    router.push('/setup')
  }, [router])

  return (
    <MainLayout>
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-page-heading" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                Welcome back!
              </h1>
              <p className="text-subheading" style={{ color: 'hsl(var(--text-secondary))' }}>
                Monitor your AI-powered campaigns and track customer engagement in real-time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/setup">
                <Button className="btn-primary flex items-center gap-2">
                  <span className="material-symbols-outlined icon-large">bolt</span>
                  New Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="card group">
            <CardContent style={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-small" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Total Calls</p>
                  <p className="text-page-heading" style={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>479</p>
                  <p className="text-small text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% vs last month
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-info rounded-lg">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                    phone
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card">
            <CardContent style={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-small" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Answer Rate</p>
                  <p className="text-page-heading" style={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>67%</p>
                  <p className="text-small text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +5% vs last month
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-success rounded-lg">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                    bar_chart
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card">
            <CardContent style={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-small" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Appointments</p>
                  <p className="text-page-heading" style={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>72</p>
                  <p className="text-small text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +18% vs last month
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                    event
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card">
            <CardContent style={{ padding: '20px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-small" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Active Campaigns</p>
                  <p className="text-page-heading" style={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>1</p>
                  <p className="text-small text-warning flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    2 hours remaining
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-warning rounded-lg">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                    schedule
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="card relative overflow-hidden bg-primary text-primary-foreground">
            <CardHeader style={{ padding: '24px 24px 16px 24px' }}>
              <CardTitle className="flex items-center text-page-heading">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mr-4">
                  <span className="material-symbols-outlined icon-large">upload</span>
                </div>
                Setup New Campaign
              </CardTitle>
              <CardDescription className="text-subheading" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Upload customer data and launch AI-powered calling campaigns with intelligent conversation flows
              </CardDescription>
            </CardHeader>
            <CardContent style={{ padding: '0 24px 24px 24px' }}>
              <Link href="/setup">
                <Button className="w-full bg-surface text-primary hover:bg-surface/90 btn-large">
                  Launch Campaign Builder
                  <span className="material-symbols-outlined icon-large ml-2">bolt</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card relative overflow-hidden bg-success text-white">
            <CardHeader style={{ padding: '24px 24px 16px 24px' }}>
              <CardTitle className="flex items-center text-page-heading">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mr-4">
                  <span className="material-symbols-outlined icon-large">analytics</span>
                </div>
                Campaign Analytics
              </CardTitle>
              <CardDescription className="text-subheading" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Deep insights and performance metrics with real-time monitoring and detailed reporting
              </CardDescription>
            </CardHeader>
            <CardContent style={{ padding: '0 24px 24px 24px' }}>
              <Link href="/results">
                <Button className="w-full bg-surface text-success hover:bg-surface/90 btn-large">
                  View Analytics Dashboard
                  <span className="material-symbols-outlined icon-large ml-2">trending_up</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <Card className="card">
          <CardHeader className="border-b border-border" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-page-heading" style={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>Recent Campaigns</CardTitle>
                <CardDescription className="text-subheading" style={{ color: 'hsl(var(--text-secondary))' }}>Track performance and engagement across all your campaigns</CardDescription>
              </div>
              <Link href="/results">
                <Button variant="outline" className="btn-medium">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent style={{ padding: '24px' }}>
            <div className="space-y-4">
              {mockCampaigns.map((campaign) => (
                <div key={campaign.id} className="group flex items-center justify-between border border-border rounded-lg transition-all duration-150 hover:bg-muted" style={{ padding: '16px' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-body" style={{ color: 'hsl(var(--text-primary))' }}>{campaign.name}</h3>
                      <Badge className={`${useCaseColors[campaign.useCase]} rounded-full px-3 py-1 text-small`}>
                        {campaign.useCase}
                      </Badge>
                      <Badge className={`${statusColors[campaign.status]} rounded-full px-3 py-1 text-small`}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    {campaign.status === 'Running' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-small mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>
                          <span>Progress: {campaign.progress}%</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ETA: {campaign.eta}
                          </span>
                        </div>
                        <Progress value={campaign.progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-info rounded-md">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>
                            phone
                          </span>
                        </div>
                        <div>
                          <p className="text-small" style={{ color: 'hsl(var(--text-secondary))' }}>Calls</p>
                          <p className="text-body" style={{ color: 'hsl(var(--text-primary))' }}>{campaign.callsPlaced}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-success rounded-md">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>
                            bar_chart
                          </span>
                        </div>
                        <div>
                          <p className="text-small" style={{ color: 'hsl(var(--text-secondary))' }}>Answer Rate</p>
                          <p className="text-body" style={{ color: 'hsl(var(--text-primary))' }}>{campaign.answerRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-md">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>
                            event
                          </span>
                        </div>
                        <div>
                          <p className="text-small" style={{ color: 'hsl(var(--text-secondary))' }}>Appointments</p>
                          <p className="text-body" style={{ color: 'hsl(var(--text-primary))' }}>{campaign.appointmentsBooked}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/results/${campaign.id}`}>
                    <Button variant="outline" className="btn-small ml-4">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
