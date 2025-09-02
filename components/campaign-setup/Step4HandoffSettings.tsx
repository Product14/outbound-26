'use client'

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { TimePicker } from "@/components/ui/time-picker"
import { AlertCircle } from 'lucide-react'
import { CampaignData, ValidationErrors } from '@/types/campaign-setup'

interface Step4HandoffSettingsProps {
  campaignData: CampaignData
  setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
  selectedCategory: string
  errors: ValidationErrors
  setErrors: (updater: (prev: ValidationErrors) => ValidationErrors) => void
}

export default function Step4HandoffSettings({
  campaignData,
  setCampaignData,
  selectedCategory,
  errors,
  setErrors
}: Step4HandoffSettingsProps) {
  return (
    <div className="max-w-3xl">
      <div className="space-y-6">
        <div className="bg-transparent border-0 p-0">
          <div className="mb-4">
            <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Handoff Settings</h1>
            <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
              Configure human agent handoff settings for your sales campaign
            </p>
          </div>
        </div>

        {/* Human Handoff Settings */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-bold text-[#1A1A1A]">Human Handoff Settings</h3>
              <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Configure when and how to escalate to human agents</p>
            </div>
            
            <div className="space-y-6">
              {/* Handoff Target */}
              <div>
                <h4 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">Handoff Target</h4>
                <RadioGroup 
                  value={campaignData.handoffSettings?.target || "round_robin"} 
                  onValueChange={(value) => setCampaignData(prev => ({ 
                    ...prev, 
                    handoffSettings: { 
                      ...prev.handoffSettings, 
                      target: value 
                    } 
                  }))}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="round_robin" id="round_robin" />
                    <Label htmlFor="round_robin" className="text-[14px] text-[#1A1A1A]">Round-robin to available team</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="specific_user" id="specific_user" />
                    <Label htmlFor="specific_user" className="text-[14px] text-[#1A1A1A]">Specific user or number</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Business Hours */}
              <div>
                <h4 className={`text-[14px] font-semibold mb-3 ${
                  errors.handoffBusinessHoursStart || errors.handoffBusinessHoursEnd ? 'text-red-600' : 'text-[#1A1A1A]'
                }`}>
                  Business Hours {(errors.handoffBusinessHoursStart || errors.handoffBusinessHoursEnd) && <span className="text-red-500">*</span>}
                </h4>
                {(errors.handoffBusinessHoursStart || errors.handoffBusinessHoursEnd) && (
                  <p className="text-[12px] text-red-600 flex items-center mb-3">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.handoffBusinessHoursStart && !errors.handoffBusinessHoursEnd && 'Start time is required'}
                    {!errors.handoffBusinessHoursStart && errors.handoffBusinessHoursEnd && 'End time is required'}
                    {errors.handoffBusinessHoursStart && errors.handoffBusinessHoursEnd && 'Start and end times are required'}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={`text-[14px] font-medium mb-2 block ${
                      errors.handoffBusinessHoursStart ? 'text-red-600' : 'text-[#1A1A1A]/60'
                    }`}>
                      Start Time {errors.handoffBusinessHoursStart && <span className="text-red-500">*</span>}
                    </Label>
                    <TimePicker
                      value={campaignData.handoffSettings?.businessHoursStart || "09:00"}
                      onChange={(value) => {
                        setCampaignData(prev => ({ 
                        ...prev, 
                        handoffSettings: { 
                          ...prev.handoffSettings, 
                          businessHoursStart: value 
                        } 
                        }))
                        if (errors.handoffBusinessHoursStart && value) {
                          setErrors(prev => ({ ...prev, handoffBusinessHoursStart: false }))
                        }
                      }}
                      placeholder="Select start time"
                      className={errors.handoffBusinessHoursStart ? 'border-red-500' : ''}
                    />
                    {errors.handoffBusinessHoursStart && (
                      <p className="text-[12px] text-red-600 mt-1">Start time is required</p>
                    )}
                  </div>
                  <div>
                    <Label className={`text-[14px] font-medium mb-2 block ${
                      errors.handoffBusinessHoursEnd ? 'text-red-600' : 'text-[#1A1A1A]/60'
                    }`}>
                      End Time {errors.handoffBusinessHoursEnd && <span className="text-red-500">*</span>}
                    </Label>
                    <TimePicker
                      value={campaignData.handoffSettings?.businessHoursEnd || "17:00"}
                      onChange={(value) => {
                        setCampaignData(prev => ({ 
                        ...prev, 
                        handoffSettings: { 
                          ...prev.handoffSettings, 
                          businessHoursEnd: value 
                        } 
                        }))
                        if (errors.handoffBusinessHoursEnd && value) {
                          setErrors(prev => ({ ...prev, handoffBusinessHoursEnd: false }))
                        }
                      }}
                      placeholder="Select end time"
                      className={errors.handoffBusinessHoursEnd ? 'border-red-500' : ''}
                    />
                    {errors.handoffBusinessHoursEnd && (
                      <p className="text-[12px] text-red-600 mt-1">End time is required</p>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-[#6B7280] mt-3">
                  Outside business hours, leads will be sent to voicemail or SMS fallback
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Triggers */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-bold text-[#1A1A1A]">Escalation Triggers</h3>
              <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Automatic conditions that trigger human handoff</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="lead_requests_person" 
                  checked={campaignData.escalationTriggers?.leadRequestsPerson || false}
                  onCheckedChange={(checked) => setCampaignData(prev => ({ 
                    ...prev, 
                    escalationTriggers: { 
                      ...prev.escalationTriggers, 
                      leadRequestsPerson: checked as boolean 
                    } 
                  }))}
                />
                <div className="flex-1">
                  <Label htmlFor="lead_requests_person" className="text-[14px] font-medium text-[#1A1A1A]">
                    Lead requests to &quot;talk to a person&quot;
                  </Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="complex_financing" 
                  checked={campaignData.escalationTriggers?.complexFinancing || false}
                  onCheckedChange={(checked) => setCampaignData(prev => ({ 
                    ...prev, 
                    escalationTriggers: { 
                      ...prev.escalationTriggers, 
                      complexFinancing: checked as boolean 
                    } 
                  }))}
                />
                <div className="flex-1">
                  <Label htmlFor="complex_financing" className="text-[14px] font-medium text-[#1A1A1A]">
                    Complex financing questions
                  </Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="pricing_negotiation" 
                  checked={campaignData.escalationTriggers?.pricingNegotiation || false}
                  onCheckedChange={(checked) => setCampaignData(prev => ({ 
                    ...prev, 
                    escalationTriggers: { 
                      ...prev.escalationTriggers, 
                      pricingNegotiation: checked as boolean 
                    } 
                  }))}
                />
                <div className="flex-1">
                  <Label htmlFor="pricing_negotiation" className="text-[14px] font-medium text-[#1A1A1A]">
                    Pricing negotiation requests
                  </Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="technical_questions" 
                  checked={campaignData.escalationTriggers?.technicalQuestions || false}
                  onCheckedChange={(checked) => setCampaignData(prev => ({ 
                    ...prev, 
                    escalationTriggers: { 
                      ...prev.escalationTriggers, 
                      technicalQuestions: checked as boolean 
                    } 
                  }))}
                />
                <div className="flex-1">
                  <Label htmlFor="technical_questions" className="text-[14px] font-medium text-[#1A1A1A]">
                    Detailed technical vehicle questions
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
