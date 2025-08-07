'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, Upload, FileText, Calendar, CheckCircle, Download, AlertCircle, Zap, Clock, Users, Database, Plus, X } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { BarChart3 } from 'lucide-react'
import confetti from 'canvas-confetti'

interface SubCase {
  value: string;
  label: string;
  requiredFields: string[];
}

interface UseCase {
  label: string;
  color: string;
  subCases: SubCase[];
}

interface UseCases {
  [key: string]: UseCase;
}

interface MockDataRow {
  [key: string]: string;
}

const steps = [
  { id: 1, name: 'Campaign Details', number: '01' },
  { id: 2, name: 'File Upload', number: '02' },
  { id: 3, name: 'Review & Schedule', number: '03' },
  { id: 4, name: 'Campaign Started', number: '04' }
]

const useCases: UseCases = {
  sales: {
    label: 'Sales',
    color: 'bg-green-lighter text-green-darker border-green-8',
    subCases: [
      { value: 'follow-up-leads', label: 'Follow-up on Leads', requiredFields: ['Customer Name', 'Phone', 'Lead Source', 'Vehicle Interest'] },
      { value: 'inventory-promotion', label: 'Inventory Promotion', requiredFields: ['Customer Name', 'Phone', 'Previous Purchase', 'Preferred Vehicle Type'] },
      { value: 'trade-in-offers', label: 'Trade-in Offers', requiredFields: ['Customer Name', 'Phone', 'Current Vehicle', 'VIN', 'Mileage'] }
    ]
  },
  service: {
    label: 'Service',
    color: 'bg-blue-lighter text-blue-purple border-blue-8',
    subCases: [
      { value: 'maintenance-reminder', label: 'Maintenance Reminder', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Last Service Date', 'Vehicle Make/Model'] },
      { value: 'recall-notification', label: 'Recall Notification', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Vehicle Make/Model/Year'] },
      { value: 'warranty-expiration', label: 'Warranty Expiration', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Warranty End Date', 'Vehicle Make/Model'] },
      { value: 'seasonal-service', label: 'Seasonal Service', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Service Type', 'Vehicle Make/Model'] }
    ]
  }
}

const mockData: MockDataRow[] = [
  { 
    'Customer Name': 'John Smith', 
    'Phone': '(555) 123-4567', 
    'VIN': '1HGBH41JXMN109186', 
    'Vehicle Make/Model': 'Honda Civic', 
    'Last Service Date': '2023-08-15',
  },
  { 
    'Customer Name': 'Sarah Johnson', 
    'Phone': '(555) 234-5678', 
    'VIN': '2T1BURHE0JC123456', 
    'Vehicle Make/Model': 'Toyota Corolla', 
    'Last Service Date': '2023-09-22',
  },
  { 
    'Customer Name': 'Mike Davis', 
    'Phone': '(555) 345-6789', 
    'VIN': '3VW2B7AJ8KM123789', 
    'Vehicle Make/Model': 'Volkswagen Jetta', 
    'Last Service Date': '2023-07-10',
  }
]

export default function CampaignSetup() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [needsAgent, setNeedsAgent] = useState(false)
  const [campaignData, setCampaignData] = useState({
    campaignName: '',
    useCase: '',
    subUseCase: '',
    bcdDetails: '',
    fileName: '',
    schedule: 'now',
    scheduledDate: '',
    scheduledTime: '',
    estimatedTime: '2-3 hours',
    totalRecords: 0
  })
  const [createdCampaignId, setCreatedCampaignId] = useState('')
  
  // Animation states
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isStepTransitioning, setIsStepTransitioning] = useState(false)

  // Page entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setHasError(false)
      setUploadComplete(false)
      setCampaignData(prev => ({ ...prev, fileName: file.name, totalRecords: 156 }))
    
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
      
        if (progress >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setUploadComplete(true)
        
          // Simulate validation error occasionally (20% chance)
          if (Math.random() > 0.8) {
            setHasError(true)
            setUploadComplete(false)
          }
        }
      }, 150)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      // If we're launching the campaign (moving from step 3 to 4), create and save the campaign
      if (currentStep === 3) {
        // Create the new campaign object
        const campaignId = `camp_${Date.now()}`
        const newCampaign = {
          id: campaignId,
          name: campaignData.campaignName,
          useCase: useCases[campaignData.useCase]?.label || campaignData.useCase,
          subUseCase: useCases[campaignData.useCase]?.subCases.find(sc => sc.value === campaignData.subUseCase)?.label || campaignData.subUseCase,
          status: campaignData.schedule === 'now' ? 'Running' : 'Scheduled',
          progress: campaignData.schedule === 'now' ? 0 : 0,
          eta: campaignData.schedule === 'now' ? campaignData.estimatedTime : null,
          callsPlaced: 0,
          totalRecords: campaignData.totalRecords,
          answerRate: 0,
          appointmentsBooked: 0,
          successRate: 0,
          createdAt: new Date(),
          startedAt: campaignData.schedule === 'now' ? new Date() : null,
          scheduledFor: campaignData.schedule === 'scheduled' ? new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime}`) : null,
          fileName: campaignData.fileName
        }

        // Save to localStorage
        try {
          const existingCampaigns = localStorage.getItem('outbound-campaigns')
          const campaigns = existingCampaigns ? JSON.parse(existingCampaigns) : []
          campaigns.push(newCampaign)
          localStorage.setItem('outbound-campaigns', JSON.stringify(campaigns))
        } catch (error) {
          console.error('Error saving campaign to localStorage:', error)
        }

        // Store the campaign ID for the analytics button
        setCreatedCampaignId(campaignId)
        // Trigger confetti animation from bottom of the page
        confetti({
          particleCount: 150,
          spread: 180,
          origin: { y: 1, x: 0.5 },
          colors: ['#4600F2', '#22C55E', '#FACC15', '#3B82F6', '#EF4444', '#8B5CF6']
        })
        
        // Add multiple bursts from different positions for full page coverage
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 180,
            origin: { y: 1, x: 0.2 },
            colors: ['#4600F2', '#22C55E', '#FACC15', '#3B82F6', '#EF4444', '#8B5CF6']
          })
        }, 150)
        
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 180,
            origin: { y: 1, x: 0.8 },
            colors: ['#4600F2', '#22C55E', '#FACC15', '#3B82F6', '#EF4444', '#8B5CF6']
          })
        }, 300)
      }
      
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCancel = () => {
    // Navigate back to the campaigns list page
    router.push('/results')
  }

  const getRequiredFields = () => {
    if (!campaignData.useCase || !campaignData.subUseCase) return []
    const useCase = useCases[campaignData.useCase]
    const subCase = useCase?.subCases.find(sc => sc.value === campaignData.subUseCase)
    return subCase?.requiredFields || []
  }

  const resetUpload = () => {
    setIsUploading(false)
    setUploadComplete(false)
    setHasError(false)
    setUploadProgress(0)
    setCampaignData(prev => ({ ...prev, fileName: '', totalRecords: 0 }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-3xl">
            <div className="space-y-8">
              <div className="mb-8 bg-transparent">
                <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Campaign Details</h1>
                <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                  Configure your campaign settings and define the specific use case for optimal AI performance
                </p>
              </div>
              <div className="space-y-6">
                
                {/* Campaign Name Section */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                  <div className="space-y-3">
                    <Label htmlFor="campaign-name" className="text-[16px] font-bold text-[#1A1A1A]">
                      Campaign Name
                    </Label>
                    <Input
                      id="campaign-name"
                      placeholder="Enter a descriptive campaign name"
                      value={campaignData.campaignName}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, campaignName: e.target.value }))}
                      className="h-11 text-[14px] border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] transition-colors"
                    />
                  </div>
                </div>

                {/* Use Case Section */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                  <div className="space-y-4">
                    <Label className="text-[16px] font-bold text-[#1A1A1A]">
                      Select Use Case
                    </Label>
                    <RadioGroup 
                      value={campaignData.subUseCase} 
                      onValueChange={(value) => {
                        const selectedUseCase = Object.entries(useCases).find(([_, useCase]) => 
                          useCase.subCases.some(subCase => subCase.value === value)
                        );
                        if (selectedUseCase) {
                          setCampaignData(prev => ({ 
                            ...prev, 
                            useCase: selectedUseCase[0], 
                            subUseCase: value 
                          }));
                          setNeedsAgent(value === 'follow-up-leads' || value === 'trade-in-offers');
                        }
                      }}
                      className="space-y-4"
                    >
                      {Object.entries(useCases).map(([categoryKey, useCase]) => (
                        <div key={categoryKey} className="space-y-3">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className={`w-3 h-3 rounded-full ${
                              categoryKey === 'sales' ? 'bg-[#22C55E]' : 'bg-[#3B82F6]'
                            }`} />
                            <h3 className="text-[14px] font-medium text-[#1A1A1A] leading-[1.5]">{useCase.label}</h3>
                          </div>
                          <div className="space-y-2 ml-5">
                            {useCase.subCases.map((subCase) => (
                              <div key={subCase.value} className="flex items-center space-x-3">
                                <RadioGroupItem value={subCase.value} id={subCase.value} className="border-[#E5E7EB]" />
                                <Label 
                                  htmlFor={subCase.value} 
                                  className="flex-1 cursor-pointer p-3 border border-[#E5E7EB] rounded-lg hover:bg-[#4600F214] transition-colors"
                                >
                                  <span className="text-[14px] text-[#1A1A1A] leading-[1.5]">{subCase.label}</span>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                {/* Agent Creation Notice */}
                {needsAgent && (
                  <div className="border border-[#FACC15] bg-[#FACC15]/10 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Users className="h-5 w-5 text-[#FACC15] mt-0.5" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[14px] font-medium text-[#1A1A1A]">Agent Creation Required</h4>
                        <p className="text-[14px] text-[#6B7280] leading-[1.5]">
                          This use case requires a specialized AI agent. We&apos;ll create one based on your requirements.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 px-3 text-[12px] border-[#FACC15] text-[#1A1A1A] hover:bg-[#FACC15]/20 rounded-lg font-medium"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Create Agent
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="max-w-3xl space-y-6">
            <div className="space-y-6">
              <div className="bg-transparent border-0 p-0">
                <div className="mb-4">
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Upload Customer Data</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Upload your customer data file to power your AI calling campaign with personalized outreach
                  </p>
                </div>
              </div>

              {campaignData.subUseCase && (
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                  <div className="border border-[#3B82F6] bg-[#3B82F6]/10 rounded-lg p-4">
                    <div className="mb-3">
                      <h3 className="text-[#3B82F6] flex items-center text-[14px] font-medium">
                        <Database className="h-4 w-4 mr-2" />
                        Required Fields for {useCases[campaignData.useCase]?.subCases.find(sc => sc.value === campaignData.subUseCase)?.label}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getRequiredFields().map((field) => (
                        <Badge key={field} variant="outline" className="border-[#3B82F6] text-[#3B82F6] text-[12px] bg-white rounded-full">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#4600F2] hover:bg-[#4600F214] transition-all duration-300 bg-[#F4F5F8]">
                  <Upload className="h-12 w-12 text-[#6B7280] mx-auto mb-4" />
                  <div className="space-y-3">
                    <p className="text-[14px] font-semibold text-[#1A1A1A]">Drag and drop your file here</p>
                    <p className="text-[14px] text-[#6B7280]">or</p>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="mt-2 h-9 px-3 text-[12px] border-[#4600F2] text-[#4600F2] hover:bg-[#4600F214] rounded-lg font-medium" 
                        size="sm"
                      >
                        Browse Files
                      </Button>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </Label>
                  </div>
                  <p className="text-[12px] text-[#6B7280] mt-4">Supports .xlsx and .csv files up to 10MB</p>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-3 mt-6 bg-white p-4 rounded-lg border border-[#E5E7EB]">
                  <div className="flex justify-between text-[14px] font-medium">
                    <span className="text-[#1A1A1A]">Uploading {campaignData.fileName}...</span>
                    <span className="text-[#4600F2]">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-3" />
                </div>
              )}

              {uploadComplete && !hasError && (
                <div className="mt-6">
                  <div className="flex items-center p-6 bg-[#22C55E]/10 border-2 border-[#22C55E] rounded-lg mb-6">
                    <CheckCircle className="h-6 w-6 text-[#22C55E] mr-4" />
                    <div>
                      <p className="font-semibold text-[#1A1A1A] text-[16px]">File uploaded successfully</p>
                      <p className="text-[#6B7280] text-[14px]">{campaignData.fileName} • {campaignData.totalRecords} rows detected</p>
                    </div>
                  </div>

                  {/* Field Mapping Preview */}
                  <div className="border border-[#E5E7EB] rounded-lg bg-white">
                    <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                      <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Field Mapping Preview</h3>
                      <p className="text-[14px] text-[#6B7280]">First 3 rows with field mapping</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#E5E7EB]">
                        <thead className="bg-[#F4F5F8]">
                          <tr>
                            {getRequiredFields().slice(0, 6).map((field) => (
                              <th key={field} className="px-6 py-4 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#E5E7EB]">
                          {mockData.slice(0, 3).map((row, index) => (
                            <tr key={index} className="hover:bg-[#F4F5F8]">
                              {getRequiredFields().slice(0, 6).map((field) => (
                                <td key={field} className="px-6 py-4 whitespace-nowrap text-[14px] text-[#1A1A1A]">
                                  {row[field] || 'N/A'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {hasError && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-start p-6 bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-lg">
                    <AlertCircle className="h-6 w-6 text-[#EF4444] mr-4 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-[#1A1A1A] text-[16px]">Field Mapping Error</p>
                      <p className="text-[#6B7280] text-[14px] mb-4">Missing required fields: {getRequiredFields().slice(-2).join(', ')}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 px-3 text-[12px] border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg font-medium"
                        onClick={() => {
                          setHasError(false)
                          setUploadComplete(false)
                          setCampaignData(prev => ({ ...prev, fileName: '', totalRecords: 0 }))
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!uploadComplete && !isUploading && (
                <div className="text-center mt-4">
                  <Button 
                    onClick={() => {
                      setCampaignData(prev => ({ ...prev, fileName: 'test-data.csv', totalRecords: 156 }))
                      setIsUploading(true)
                      let progress = 0
                      const interval = setInterval(() => {
                        progress += 10
                        setUploadProgress(progress)
                        if (progress >= 100) {
                          clearInterval(interval)
                          setIsUploading(false)
                          setUploadComplete(true)
                        }
                      }, 150)
                    }}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-[12px] text-[#6B7280] border-[#E5E7EB] hover:bg-[#4600F214] rounded-lg font-medium"
                  >
                    Test Upload (Demo)
                  </Button>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="max-w-3xl">
            <div className="space-y-6">
              <div className="bg-transparent border-0 p-0">
                <div className="mb-4">
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Review & Schedule</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Review your campaign details and schedule execution
                  </p>
                </div>
              </div>

              {/* Campaign Summary */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg">
                <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                  <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Campaign Summary</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">Campaign Name</p>
                      <p className="text-[16px] text-[#1A1A1A]">{campaignData.campaignName || 'Untitled Campaign'}</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">Use Case</p>
                      <div className="mt-1">
                        <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]">
                          {useCases[campaignData.useCase]?.label} - {useCases[campaignData.useCase]?.subCases.find(sc => sc.value === campaignData.subUseCase)?.label}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">Total Records</p>
                      <p className="text-[16px] text-[#1A1A1A]">{campaignData.totalRecords} customers</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">Estimated Time</p>
                      <p className="text-[16px] text-[#1A1A1A]">{campaignData.estimatedTime}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">File</p>
                      <p className="text-[16px] text-[#1A1A1A]">{campaignData.fileName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Options */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg">
                <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                  <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Schedule Campaign</h3>
                  <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Choose when to launch your AI-powered calling campaign</p>
                </div>
                <div className="p-6">
                  <RadioGroup
                    value={campaignData.schedule}
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, schedule: value }))}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-3 p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#4600F214] transition-colors">
                      <RadioGroupItem value="now" id="now" className="border-[#E5E7EB]" />
                      <Label htmlFor="now" className="flex-1 cursor-pointer">
                        <div className="flex items-center">
                          <div className="p-2 bg-[#4600F2]/10 rounded-lg mr-3">
                            <Zap className="h-5 w-5 text-[#4600F2]" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#1A1A1A]">Start Now</p>
                            <p className="text-[14px] text-[#6B7280] leading-[1.5]">Begin calling immediately after campaign creation</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#4600F214] transition-colors">
                      <RadioGroupItem value="scheduled" id="scheduled" className="border-[#E5E7EB]" />
                      <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                        <div className="flex items-center">
                          <div className="p-2 bg-[#FACC15]/10 rounded-lg mr-3">
                            <Clock className="h-5 w-5 text-[#FACC15]" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-[#1A1A1A]">Schedule for Later</p>
                            <p className="text-[14px] text-[#6B7280] leading-[1.5]">Choose a specific date and time</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {campaignData.schedule === 'scheduled' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 p-4 bg-[#F4F5F8] rounded-lg border border-[#E5E7EB]">
                      <div>
                        <Label htmlFor="date" className="text-[16px] font-bold text-[#1A1A1A] mb-2 block">Campaign Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={campaignData.scheduledDate}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                          className="h-11 text-[14px] border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time" className="text-[16px] font-bold text-[#1A1A1A] mb-2 block">Campaign Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={campaignData.scheduledTime}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                          className="h-11 text-[14px] border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="max-w-3xl">
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="mb-4">
                  <h1 className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4]">Campaign Started!</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Your AI-powered outbound calling campaign is now active and running
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">Campaign ID</p>
                    <p className="text-[16px] font-mono text-[#1A1A1A]">CAMP_2024_001</p>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#1A1A1A] mb-2">Status</p>
                    <Badge className="bg-[#4600F2] text-white px-3 py-1 text-[12px]">
                      <Zap className="h-4 w-4 mr-2" />
                      {campaignData.schedule === 'now' ? 'Running' : 'Scheduled'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">
                      {campaignData.schedule === 'now' ? 'Expected Completion' : 'Scheduled Start'}
                    </p>
                    <p className="text-[16px] text-[#1A1A1A]">
                      {campaignData.schedule === 'now' ? 'Today, 6:30 PM' : `${campaignData.scheduledDate} at ${campaignData.scheduledTime}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href={createdCampaignId ? `/results/${createdCampaignId}` : '/results'}>
                  <Button size="lg" className="w-full h-11 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    View Campaign Analytics
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => {
                    // Reset all campaign data
                    setCampaignData({
                      campaignName: '',
                      useCase: '',
                      subUseCase: '',
                      bcdDetails: '',
                      fileName: '',
                      schedule: 'now',
                      scheduledDate: '',
                      scheduledTime: '',
                      estimatedTime: '2-3 hours',
                      totalRecords: 0
                    })
                    // Reset upload states
                    setUploadProgress(0)
                    setIsUploading(false)
                    setUploadComplete(false)
                    setHasError(false)
                    setNeedsAgent(false)
                    setCreatedCampaignId('')
                    // Reset to first step
                    setCurrentStep(1)
                  }}
                  className="w-full h-11 px-4 text-[14px] border-[#E5E7EB] text-[#6B7280] hover:bg-[#4600F214] rounded-lg font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Setup Another Campaign
                  </Button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F5F8]">
        {/* Vertical Stepper Sidebar - Now on Left */}
        <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#E5E7EB] p-6 order-first">
          <div className="space-y-8">
            <div>
              <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-6 leading-[1.4]">Setup Progress</h3>
              <div className="flex lg:flex-col space-x-6 lg:space-x-0 lg:space-y-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex lg:flex-row items-center lg:items-start min-w-0 flex-shrink-0">
                    <div className="flex flex-col lg:flex-col items-center mr-0 lg:mr-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                        currentStep > step.id 
                          ? 'bg-[#22C55E] text-white' 
                          : currentStep === step.id
                          ? 'bg-[#4600F2] text-white'
                          : 'bg-[#E5E7EB] text-[#6B7280]'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-[14px] font-semibold">{step.number}</span>
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`hidden lg:block w-0.5 h-12 mt-4 ${
                          currentStep > step.id ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 ml-3 lg:ml-0">
                      <h4 className={`text-[14px] font-medium whitespace-nowrap lg:whitespace-normal leading-[1.5] ${
                        currentStep >= step.id ? 'text-[#1A1A1A]' : 'text-[#6B7280]'
                      }`}>
                        {step.name}
                      </h4>
                      <p className={`text-[12px] mt-1 hidden lg:block leading-[1.5] ${
                        currentStep > step.id 
                          ? 'text-[#22C55E]' 
                          : currentStep === step.id
                          ? 'text-[#4600F2]'
                          : 'text-[#6B7280]'
                      }`}>
                        {currentStep > step.id 
                          ? 'Completed' 
                          : currentStep === step.id
                          ? 'In Progress'
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Now on Right */}
        <div className="flex-1 flex flex-col bg-[#F4F5F8]">
          {/* Content */}
          <div className="flex-1 px-12 py-8 pb-32">
            {renderStepContent()}
          </div>

          {/* Sticky Navigation */}
          {currentStep < 4 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-50 shadow-lg" style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '24px', paddingRight: '24px' }}>
              <div className="flex justify-between items-center">
                {/* Cancel Button - Left Side */}
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="lg"
                  className="h-11 px-4 text-[14px] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151] rounded-lg font-medium"
                >
                  <X className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>

                {/* Navigation Buttons - Right Side */}
                <div className="flex items-center space-x-3">
                  {currentStep > 1 && (
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      size="lg"
                      className="h-11 px-4 text-[14px] border-[#E5E7EB] text-[#6B7280] hover:bg-[#4600F214] rounded-lg font-medium"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                  )}
                  <Button
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && (!campaignData.campaignName || !campaignData.useCase || !campaignData.subUseCase)) ||
                      (currentStep === 2 && !uploadComplete) ||
                      (currentStep === 3 && campaignData.schedule === 'scheduled' && (!campaignData.scheduledDate || !campaignData.scheduledTime))
                    }
                    size="lg"
                    className="h-11 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {currentStep === 3 ? 'Launch Campaign' : 'Continue'}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
