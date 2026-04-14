'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingUp, Wrench, Users, ArrowLeft, MessageSquare, PhoneCall, Zap, Repeat } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CampaignData, ValidationErrors } from '@/types/campaign-setup'
import { getDynamicUseCases } from '@/utils/campaign-setup-utils'
import { Agent } from '@/lib/agent-api'
import { CampaignTypesResponse } from '@/lib/campaign-api'
import { buildUrlWithParams } from '@/lib/url-utils'

interface Step1CampaignDetailsProps {
  campaignData: CampaignData
  setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  errors: ValidationErrors
  setErrors: (updater: (prev: ValidationErrors) => ValidationErrors) => void
  availableAgents: Agent[]
  selectedAgent: Agent | null
  setSelectedAgent: (agent: Agent | null) => void
  isLoadingAgents: boolean
  agentError: string | null
  campaignTypes: CampaignTypesResponse | null
}

export default function Step1CampaignDetails({
  campaignData,
  setCampaignData,
  selectedCategory,
  setSelectedCategory,
  errors,
  setErrors,
  availableAgents,
  selectedAgent,
  setSelectedAgent,
  isLoadingAgents,
  agentError,
  campaignTypes
}: Step1CampaignDetailsProps) {
  const router = useRouter()
  
  const campaignNameRef = useRef<HTMLDivElement | null>(null)
  const useCaseRef = useRef<HTMLDivElement | null>(null)
  const agentSelectionRef = useRef<HTMLDivElement | null>(null)

  const dynamicUseCases = getDynamicUseCases(campaignTypes)

  return (
    <div className="max-w-3xl">
      <div className="space-y-8">
        <div className="mb-8 bg-transparent">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push(buildUrlWithParams('/results'))}
              className="flex items-center gap-3 text-[#6B7280] hover:text-[#1A1A1A] transition-colors duration-200 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:translate-x-[-2px] transition-transform duration-200" />
             
            </button>
            <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Campaign Details</h1>
          </div>
          <p className="text-[14px] text-[#6B7280] leading-[1.5]">
            Configure your campaign settings and define the specific use case for optimal AI performance
          </p>
        </div>
        <div className="space-y-6">

        {/* Campaign Name Section */}
<div
  ref={campaignNameRef}
  className={`bg-white border rounded-lg p-6 transition-colors ${
    errors.campaignName ? 'border-red-500' : 'border-[#E5E7EB]'
  }`}
>
  <div className="space-y-3">
    <Label
      htmlFor="campaign-name"
      className={`text-[16px] font-bold ${
        errors.campaignName ? 'text-red-600' : 'text-[#1A1A1A]'
      }`}
    >
      Campaign Name <span className="text-red-500">*</span>
    </Label>

    <div className="relative">
      <Input
        id="campaign-name"
        placeholder="Enter a descriptive campaign name"
        value={campaignData.campaignName}
        maxLength={50}
        onChange={(e) => {
          setCampaignData((prev) => ({
            ...prev,
            campaignName: e.target.value,
          }));
          if (
            errors.campaignName &&
            e.target.value.trim() &&
            e.target.value.length <= 50
          ) {
            setErrors((prev) => ({ ...prev, campaignName: false }));
          }
        }}
        className={`h-11 w-full pr-12 text-[14px] rounded-md focus:ring-[#4600F2] transition-colors ${
          errors.campaignName
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20'
        }`}
      />
      {/* Character counter */}
      <div
        className={`absolute right-2 top-1/2 -translate-y-1/2 text-[12px] ${
          campaignData.campaignName.length > 50
            ? 'text-red-600'
            : campaignData.campaignName.length > 40
            ? 'text-orange-600'
            : 'text-[#6B7280]'
        }`}
      >
        {campaignData.campaignName.length}/50
      </div>
    </div>

    {errors.campaignName && (
      <p className="text-[12px] text-red-600 flex items-center mt-1">
        <AlertCircle className="h-3 w-3 mr-1" />
        {!campaignData.campaignName.trim()
          ? 'Campaign name is required'
          : campaignData.campaignName.length > 50
          ? 'Campaign name must be 50 characters or less'
          : 'Campaign name is required'}
      </p>
    )}
  </div>
</div>


          {/* Use Case Section */}
          <div ref={useCaseRef} className={`bg-white border rounded-lg p-6 transition-colors ${
            errors.useCase || errors.subUseCase ? 'border-red-500' : 'border-[#E5E7EB]'
          }`}>
            <div className="space-y-4">
              <Label className={`text-[16px] font-bold ${
                errors.useCase || errors.subUseCase ? 'text-red-600' : 'text-[#1A1A1A]'
              }`}>
                Select Campaign Type <span className="text-red-500">*</span>
              </Label>
              {(errors.useCase || errors.subUseCase) && (
                <p className="text-[12px] text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a use case and campaign type
                </p>
              )}
              {/* Category Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {['sales', 'service'].map((categoryKey) => {
                  const useCases = getDynamicUseCases(campaignTypes);
                  const useCase = useCases[categoryKey];
                  if (!useCase) return null;
                  return (
                  <div 
                    key={categoryKey} 
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedCategory === categoryKey
                        ? 'border-[#4600f2] bg-[#4600f2]/5 shadow-sm'
                        : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:shadow-sm'
                    }`}
                    onClick={() => {
                      setSelectedCategory(categoryKey);
                      setCampaignData(prev => ({ 
                        ...prev, 
                        useCase: categoryKey, 
                        subUseCase: '' 
                      }));
                      // Clear errors when category is selected
                      if (errors.useCase || errors.subUseCase) {
                        setErrors(prev => ({ ...prev, useCase: false, subUseCase: false }))
                      }
                       
                      // Update URL to preserve tab state on refresh
                      if (typeof window !== 'undefined') {
                        const currentUrl = new URL(window.location.href)
                        currentUrl.searchParams.set('tab', categoryKey)
                        window.history.replaceState({}, '', currentUrl.toString())
                      }
                    }}
                  >
                    {/* Category Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        categoryKey === 'sales' 
                          ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                          : 'bg-[#3B82F6]/10 text-[#3B82F6]'
                      }`}>
                        {categoryKey === 'sales' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <Wrench className="w-4 h-4" />
                        )}
                      </div>
                      <h3 className="text-[16px] font-semibold leading-[1.4] text-[#1A1A1A]">
                        {useCase.label}
                      </h3>
                    </div>

                    {/* Category Description */}
                    <p className="text-[13px] leading-[1.5] text-[#6B7280]">
                      {categoryKey === 'sales' 
                        ? 'AI-powered outreach campaigns for lead generation and sales conversion'
                        : 'Automated customer service communications and maintenance reminders'
                      }
                    </p>
                  </div>
                  );
                })}
              </div>

              {/* Sub-options for selected category */}
              {selectedCategory && getDynamicUseCases(campaignTypes)[selectedCategory] && (
                <div className="space-y-3">
                  <div className="text-[12px] font-medium text-[#6B7280] mt-6 mb-4">
                    What type of campaign would you like to run? <span className="text-red-500">*</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {getDynamicUseCases(campaignTypes)[selectedCategory].subCases.map((subCase: any) => (
                      <button
                        key={subCase.value}
                        type="button"
                        onClick={() => {
                          setCampaignData(prev => ({ 
                            ...prev, 
                            subUseCase: subCase.value 
                          }));

                          // Clear errors when valid selection is made
                          if (errors.subUseCase) {
                            setErrors(prev => ({ ...prev, subUseCase: false }))
                          }
                          // Scroll to agent selection for service use cases only
                          if (selectedCategory === 'service') {
                            setTimeout(() => {
                              agentSelectionRef.current?.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                              });
                            }, 100); // Small delay to ensure element is rendered
                          }
                        }}
                        className={`px-4 py-2 rounded-full border transition-all duration-200 text-[14px] font-medium whitespace-nowrap ${
                          campaignData.subUseCase === subCase.value
                            ? 'border-[#4600f2] bg-[#4600f2] text-white shadow-sm'
                            : 'border-[#E5E7EB] bg-white text-[#1A1A1A] hover:border-[#4600f2]/40 hover:bg-[#4600f2]/5 hover:shadow-sm'
                        }`}
                      >
                        {subCase.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agent Selection - Only show after campaign type is selected */}
          {selectedCategory && campaignData.subUseCase && (
            <div 
              ref={agentSelectionRef}
              className={`bg-white border rounded-lg p-6 transition-colors ${
                errors.agentSelection ? 'border-red-500' : 'border-[#E5E7EB]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className={`text-[16px] font-semibold ${
                    errors.agentSelection ? 'text-red-600' : 'text-[#1A1A1A]'
                  }`}>
                    Select AI agent <span className="text-red-500">*</span>
                  </h3>
                </div>

                {errors.agentSelection && (
                  <div className="flex items-center text-[12px] text-red-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Please select an agent to continue
                  </div>
                )}

                {isLoadingAgents && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Shimmer placeholders for agent cards */}
                    {[1, 2].map((index) => (
                      <div key={index} className="bg-white border rounded-xl p-4 pb-16 animate-pulse">
                        {/* Avatar and name shimmer */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                          </div>
                        </div>
                        
                        {/* Specialization shimmer */}
                        <div className="space-y-2 mb-4">
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          <div className="flex gap-1">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>

                        {/* Button shimmer */}
                        <div className="absolute bottom-3 left-3 right-3 h-10 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                )}

                {agentError && (
                  <div className="flex items-center p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg">
                    <AlertCircle className="h-5 w-5 text-[#EF4444] mr-3" />
                    <span className="text-[14px] text-[#EF4444]">{agentError}</span>
                  </div>
                )}

                {!isLoadingAgents && !agentError && availableAgents.length === 0 && (
                  <div className="flex items-center p-4 bg-[#FACC15]/10 border border-[#FACC15] rounded-lg">
                    <AlertCircle className="h-5 w-5 text-[#FACC15] mr-3" />
                    <span className="text-[14px] text-[#6B7280]">No agents available for this campaign type</span>
                  </div>
                )}

                {!isLoadingAgents && availableAgents.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {availableAgents.map((agent) => (
                    <div 
                      key={agent.id} 
                      onClick={() => {
                        if (agent.available) {
                          setSelectedAgent(agent)
                          // Clear agent selection error when an agent is selected
                          if (errors.agentSelection) {
                            setErrors(prev => ({ ...prev, agentSelection: false }))
                          }
                        }
                      }}
                      className={`relative bg-white border rounded-xl p-4 pb-16 transition-all duration-200 ${
                        !agent.available
                          ? 'opacity-50 cursor-not-allowed border-[#E5E7EB]'
                          : selectedAgent?.id === agent.id
                          ? 'cursor-pointer border-[#4600F2] bg-[#4600F2]/5'
                          : 'cursor-pointer border-[#E5E7EB] hover:border-[#4600F2]/60 hover:bg-[#4600F2]/5'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {selectedAgent?.id === agent.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-[#4600F2] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Top Section: Profile Photo, Name, and Chips */}
                        <div className="flex items-start space-x-4">
                          {/* Profile Picture */}
                          <div className="flex-shrink-0 -mt-1">
                            <img
                              src={agent.imageUrl}
                              alt={agent.name}
                              className="w-16 h-16 rounded-lg object-cover object-top border-2 border-[#E5E7EB]"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-user.jpg'
                              }}
                            />
                          </div>

                          {/* Agent Info */}
                          <div className="flex-1 min-w-0">
                            {/* Name */}
                            <h4 className={`text-[16px] font-bold text-black mb-2 ${
                              !agent.available ? 'text-[#9CA3AF]' : ''
                            }`}>
                              {agent.name}
                            </h4>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                {agent.city}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                {agent.languageName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Call Statistics */}
                        <div className="flex justify-between">
                          <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1 mr-2">
                            <p className="text-xs text-gray-500 mb-1">Total Calls</p>
                            <p className="text-base font-bold text-black">{agent.totalCalls}</p>
                          </div>
                          <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1">
                            <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                            <p className="text-base font-bold text-black">{agent.totalCalls > 0 ? '75%' : '0%'}</p>
                          </div>
                        </div>

                        {/* Talk to Agent Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle talk to agent functionality
                            if (selectedAgent) {
                              parent.postMessage({
                                type: 'CALL_AGENT_BLANK',
                                data: { 
                                  agentMappingId: selectedAgent.id,
                                  customerDetails: {
                                    customerName: '',
                                    recallDetails: {}
                                  }
                                }
                              }, '*');
                            } else {
                              console.error('No agent selected for talk to agent functionality');
                            }
                          }}
                          className="absolute bottom-3 left-3 right-3 bg-[#4600F2]/10 hover:bg-[#4600F2]/15 text-[#4600F2] font-medium py-3 px-4 transition-colors text-sm font-semibold rounded-lg"
                        >
                          Talk to Agent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}

          {/* Recurring Campaign */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="h-4 w-4 text-[#7C3AED]" />
              <Label className="text-[16px] font-bold text-[#1A1A1A]">Campaign Mode</Label>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-4 leading-relaxed">
              One-time campaigns run once and stop. Recurring campaigns automatically re-enroll new leads from your CRM on a regular cadence.
            </p>

            <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg hover:border-[#CBD5E1] transition-colors">
              <div>
                <Label className="text-[14px] font-medium text-[#1A1A1A]">Enable recurring campaign</Label>
                <p className="text-[13px] text-[#6B7280] mt-0.5">
                  Automatically re-enroll new leads from CRM on a regular cadence
                </p>
              </div>
              <Checkbox
                id="enableRecurringStep1"
                checked={campaignData.vinSolutionsSettings?.enableRecurringLeads ?? false}
                onCheckedChange={(checked) =>
                  setCampaignData(prev => ({
                    ...prev,
                    vinSolutionsSettings: {
                      ...prev.vinSolutionsSettings!,
                      enableRecurringLeads: checked === true,
                    },
                  }))
                }
                className="border-2 border-[#E5E7EB] data-[state=checked]:bg-[#4600F2] data-[state=checked]:border-[#4600F2]"
              />
            </div>

            {campaignData.vinSolutionsSettings?.enableRecurringLeads && (
              <div className="mt-4 space-y-4 p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
                <div>
                  <Label className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                    Frequency
                  </Label>
                  <Select
                    value={(campaignData as any).recurringFrequency || 'weekly'}
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, recurringFrequency: value } as any))}
                  >
                    <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                    Lead Age Filter (days)
                  </Label>
                  <p className="text-[13px] text-[#6B7280] mb-2">
                    Only enroll leads that haven&apos;t been contacted in this many days
                  </p>
                  <Select
                    value={(campaignData.vinSolutionsSettings?.leadAgeDays ?? 10).toString()}
                    onValueChange={(value) =>
                      setCampaignData(prev => ({
                        ...prev,
                        vinSolutionsSettings: {
                          ...prev.vinSolutionsSettings!,
                          leadAgeDays: parseInt(value),
                        },
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="10">10 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
