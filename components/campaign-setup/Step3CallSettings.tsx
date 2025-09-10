'use client'

import { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { TimePicker } from "@/components/ui/time-picker"
import { DatePicker } from "@/components/ui/date-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

import { AlertCircle, Zap, Clock, Plus, Trash2, Info } from 'lucide-react'
import { CampaignData, ValidationErrors } from '@/types/campaign-setup'
import { Agent } from '@/lib/agent-api'
import { getDynamicUseCases } from '@/utils/campaign-setup-utils'
import { getEstimatedTimeInMinutes } from '@/lib/time-utils'
import { CampaignTypesResponse } from '@/lib/campaign-api'

interface Step3CallSettingsProps {
  campaignData: CampaignData
  setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
  selectedCategory: string
  selectedAgent: Agent | null
  errors: ValidationErrors
  setErrors: (updater: (prev: ValidationErrors) => ValidationErrors) => void
  campaignTypes?: CampaignTypesResponse | null
}

export default function Step3CallSettings({
  campaignData,
  setCampaignData,
  selectedCategory,
  selectedAgent,
  errors,
  setErrors,
  campaignTypes
}: Step3CallSettingsProps) {
  const scheduleRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()

  const handleAddTimeSlot = () => {
    if (campaignData.dailyTimeSlots.length >= 10) {
      toast({
        title: "Maximum slots reached",
        description: "You can only add up to 10 time slots per day.",
        variant: "destructive",
      })
      return
    }

    const newSlot = {
      id: Date.now().toString(),
      startTime: '09:00',
      endTime: '17:00'
    }
    setCampaignData(prev => ({
      ...prev,
      dailyTimeSlots: [...prev.dailyTimeSlots, newSlot]
    }))
  }

  return (
    <TooltipProvider>
      <div className="max-w-3xl">
        <div className="space-y-6">
          <div className="bg-transparent border-0 p-0">
            <div className="mb-4">
              <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">
                Call Settings
              </h1>
              <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                Configure call pacing, retry logic, and voicemail handling for your campaign
              </p>
            </div>
          </div>

        {/* Campaign Summary */}
        <div className={`bg-white border rounded-lg transition-colors ${
          errors.campaignSummary ? 'border-red-500' : 'border-[#E5E7EB]'
        }`}>
          <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
            <h3 className={`text-[16px] font-semibold ${
              errors.campaignSummary ? 'text-red-600' : 'text-[#1A1A1A]'
            }`}>
              Campaign Summary <span className="text-red-500">*</span>
            </h3>
            {errors.campaignSummary && (
              <p className="text-[12px] text-red-600 flex items-center mt-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                Campaign summary information is required
              </p>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[14px] font-medium text-[#666666] mb-1">Campaign Name</p>
                <p className="text-[16px] font-bold text-[#1A1A1A]">{campaignData.campaignName || 'Untitled Campaign'}</p>
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#666666] mb-1">Use Case</p>
                <div className="mt-1">
                  <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]">
                    {getDynamicUseCases(campaignTypes || null)[selectedCategory]?.label} - {getDynamicUseCases(campaignTypes || null)[selectedCategory]?.subCases.find((sc: any) => sc.value === campaignData.subUseCase)?.label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#666666] mb-1">Total Records</p>
                <p className="text-[16px] font-bold text-[#1A1A1A]">{campaignData.totalRecords} customers</p>
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#666666] mb-1">Estimated Time</p>
                <p className="text-[16px] font-bold text-[#1A1A1A]">{getEstimatedTimeInMinutes(campaignData.totalRecords)}</p>
              </div>
              {/* <div className="col-span-2">
                <p className="text-[14px] font-medium text-[#666666] mb-1">File</p>
                <p className="text-[16px] font-bold text-[#1A1A1A]">{campaignData.fileName}</p>
              </div> */}
            </div>
          </div>
        </div>

        {/* Schedule Options */}
        <div ref={scheduleRef} className={`bg-white border rounded-lg transition-colors ${
          errors.scheduledDate || errors.scheduledEndDate || errors.dailyStartTime || errors.dailyEndTime ? 'border-red-500' : 'border-[#E5E7EB]'
        }`}>
          <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
            <h3 className={`text-[16px] font-semibold ${
              errors.scheduledDate || errors.scheduledEndDate || errors.dailyStartTime || errors.dailyEndTime || errors.scheduleCampaign ? 'text-red-600' : 'text-[#1A1A1A]'
            }`}>
              Schedule Campaign <span className="text-red-500">*</span>
            </h3>
            <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Choose when to launch your AI-powered calling campaign</p>
            {(errors.scheduledDate || errors.scheduledEndDate || errors.dailyStartTime || errors.dailyEndTime) && (
              <p className="text-[12px] text-red-600 flex items-center mt-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                Please complete all schedule settings for scheduled campaigns
              </p>
            )}
          </div>
          <div className="p-6">
            <RadioGroup
              value={campaignData.schedule}
              onValueChange={(value) => setCampaignData(prev => ({ ...prev, schedule: value }))}
              className="space-y-4"
            >
              <div className="border border-[#E5E7EB] rounded-lg hover:bg-[#4600F214] transition-colors">
                <div className="flex items-center space-x-3 p-4">
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

                {/* Time Slots for Start Now - Nested inside */}
                {campaignData.schedule === 'now' && (
                  <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-[14px] font-medium text-[#1A1A1A]">Daily Time Slots</h5>
                          <p className="text-[13px] text-[#6B7280]">Add multiple time slots for each day</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddTimeSlot}
                          className="text-[14px] h-8"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Slot
                        </Button>
                      </div>
                      
                      {/* Time Slots List */}
                      <div className="space-y-3">
                        {campaignData.dailyTimeSlots.map((slot, index) => (
                          <div key={slot.id} className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg bg-white">
                            <span className="text-[13px] font-medium text-[#6B7280] min-w-[60px]">
                              Slot {index + 1}
                            </span>
                            
                            <div className="flex-1">
                              <Label className="text-[12px] font-medium text-[#1A1A1A]/60 mb-1 block">
                                Start Time
                              </Label>
                              <TimePicker
                                value={slot.startTime}
                                onChange={(value) => {
                                  setCampaignData(prev => {
                                    const updatedSlots = prev.dailyTimeSlots.map(s =>
                                      s.id === slot.id ? { ...s, startTime: value } : s
                                    );
                                    // Update legacy fields with first slot for backward compatibility
                                    const firstSlot = updatedSlots[0];
                                    return {
                                      ...prev,
                                      dailyTimeSlots: updatedSlots,
                                      dailyStartTime: firstSlot?.startTime || prev.dailyStartTime,
                                      dailyEndTime: firstSlot?.endTime || prev.dailyEndTime
                                    };
                                  });
                                }}
                                placeholder="Start time"
                                className="h-8 text-[13px]"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <Label className="text-[12px] font-medium text-[#1A1A1A]/60 mb-1 block">
                                End Time
                              </Label>
                              <TimePicker
                                value={slot.endTime}
                                onChange={(value) => {
                                  setCampaignData(prev => {
                                    const updatedSlots = prev.dailyTimeSlots.map(s =>
                                      s.id === slot.id ? { ...s, endTime: value } : s
                                    );
                                    // Update legacy fields with first slot for backward compatibility
                                    const firstSlot = updatedSlots[0];
                                    return {
                                      ...prev,
                                      dailyTimeSlots: updatedSlots,
                                      dailyStartTime: firstSlot?.startTime || prev.dailyStartTime,
                                      dailyEndTime: firstSlot?.endTime || prev.dailyEndTime
                                    };
                                  });
                                }}
                                placeholder="End time"
                                className="h-8 text-[13px]"
                              />
                            </div>
                            
                            {campaignData.dailyTimeSlots.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCampaignData(prev => {
                                    const updatedSlots = prev.dailyTimeSlots.filter(s => s.id !== slot.id);
                                    // Update legacy fields with first slot for backward compatibility
                                    const firstSlot = updatedSlots[0];
                                    return {
                                      ...prev,
                                      dailyTimeSlots: updatedSlots,
                                      dailyStartTime: firstSlot?.startTime || '09:00',
                                      dailyEndTime: firstSlot?.endTime || '17:00'
                                    };
                                  });
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Summary */}
                      {/* <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-[13px] text-[#1A1A1A] font-medium mb-1">Daily Schedule Summary:</p>
                        <p className="text-[12px] text-[#6B7280]">
                          {campaignData.dailyTimeSlots.length === 1 
                            ? `Calls will be made from ${campaignData.dailyTimeSlots[0]?.startTime || "09:00"} to ${campaignData.dailyTimeSlots[0]?.endTime || "17:00"} each day`
                            : `Calls will be made in ${campaignData.dailyTimeSlots.length} time slots: ${campaignData.dailyTimeSlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')} each day`
                          }
                        </p>
                      </div> */}
                    </div>
                  </div>
                )}
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
              <div className="bg-white border border-[#E5E7EB] rounded-lg mt-6">
                <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                  <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Schedule Settings</h3>
                  <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Set timing and call limits</p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Schedule Campaign</h4>
                      <p className="text-[14px] text-[#6B7280] mb-4">Set the date and time for your campaign to start</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate" className={`text-[14px] font-medium mb-2 block ${
                          errors.scheduledDate ? 'text-red-600' : 'text-[#1A1A1A]/60'
                        }`}>
                          Start Date {errors.scheduledDate && <span className="text-red-500">*</span>}
                        </Label>
                        <DatePicker
                          value={campaignData.scheduledDate}
                          onChange={(value) => {
                            setCampaignData(prev => ({ ...prev, scheduledDate: value }))
                            if (errors.scheduledDate && value) {
                              setErrors(prev => ({ ...prev, scheduledDate: false }))
                            }
                          }}
                          placeholder="Select start date"
                          minDate={new Date().toISOString().split('T')[0]}
                        />
                        {errors.scheduledDate && (
                          <p className="text-[12px] text-red-600 flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Start date is required
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="endDate" className={`text-[14px] font-medium mb-2 block ${
                          errors.scheduledEndDate ? 'text-red-600' : 'text-[#1A1A1A]/60'
                        }`}>
                          End Date {errors.scheduledEndDate && <span className="text-red-500">*</span>}
                        </Label>
                        <DatePicker
                          value={campaignData.scheduledEndDate}
                          onChange={(value) => {
                            setCampaignData(prev => ({ ...prev, scheduledEndDate: value }))
                            if (errors.scheduledEndDate && value) {
                              setErrors(prev => ({ ...prev, scheduledEndDate: false }))
                            }
                          }}
                          placeholder="Select end date"
                          minDate={campaignData.scheduledDate || new Date().toISOString().split('T')[0]}
                        />
                        {errors.scheduledEndDate && (
                          <p className="text-[12px] text-red-600 flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            End date is required
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="text-[14px] font-medium text-[#1A1A1A]">Daily Time Slots</h5>
                          <p className="text-[13px] text-[#6B7280]">Add multiple time slots for each day</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddTimeSlot}
                          className="text-[14px] h-8"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Slot
                        </Button>
                      </div>
                      
                      {/* Time Slots List */}
                      <div className="space-y-3">
                        {campaignData.dailyTimeSlots.map((slot, index) => (
                          <div key={slot.id} className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg bg-gray-50">
                            <span className="text-[13px] font-medium text-[#6B7280] min-w-[60px]">
                              Slot {index + 1}
                            </span>
                            
                            <div className="flex-1">
                              <Label className="text-[12px] font-medium text-[#1A1A1A]/60 mb-1 block">
                                Start Time
                              </Label>
                              <TimePicker
                                value={slot.startTime}
                                onChange={(value) => {
                                  setCampaignData(prev => {
                                    const updatedSlots = prev.dailyTimeSlots.map(s =>
                                      s.id === slot.id ? { ...s, startTime: value } : s
                                    );
                                    // Update legacy fields with first slot for backward compatibility
                                    const firstSlot = updatedSlots[0];
                                    return {
                                      ...prev,
                                      dailyTimeSlots: updatedSlots,
                                      dailyStartTime: firstSlot?.startTime || prev.dailyStartTime,
                                      dailyEndTime: firstSlot?.endTime || prev.dailyEndTime
                                    };
                                  });
                                }}
                                placeholder="Start time"
                                className="h-8 text-[13px]"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <Label className="text-[12px] font-medium text-[#1A1A1A]/60 mb-1 block">
                                End Time
                              </Label>
                              <TimePicker
                                value={slot.endTime}
                                onChange={(value) => {
                                  setCampaignData(prev => {
                                    const updatedSlots = prev.dailyTimeSlots.map(s =>
                                      s.id === slot.id ? { ...s, endTime: value } : s
                                    );
                                    // Update legacy fields with first slot for backward compatibility
                                    const firstSlot = updatedSlots[0];
                                    return {
                                      ...prev,
                                      dailyTimeSlots: updatedSlots,
                                      dailyStartTime: firstSlot?.startTime || prev.dailyStartTime,
                                      dailyEndTime: firstSlot?.endTime || prev.dailyEndTime
                                    };
                                  });
                                }}
                                placeholder="End time"
                                className="h-8 text-[13px]"
                              />
                            </div>
                            
                            {campaignData.dailyTimeSlots.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCampaignData(prev => {
                                    const updatedSlots = prev.dailyTimeSlots.filter(s => s.id !== slot.id);
                                    // Update legacy fields with first slot for backward compatibility
                                    const firstSlot = updatedSlots[0];
                                    return {
                                      ...prev,
                                      dailyTimeSlots: updatedSlots,
                                      dailyStartTime: firstSlot?.startTime || '09:00',
                                      dailyEndTime: firstSlot?.endTime || '17:00'
                                    };
                                  });
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call Rules & Behavior */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg">
          <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Call Rules & Behavior</h3>
            <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Configure how your AI agent handles different call scenarios and retry logic</p>
          </div>
          <div className="p-6">
            
            {/* Retry Settings */}
            <div className="space-y-4 lg:col-span-2">
              <h4 className={`text-[16px] font-semibold ${
                errors.retrySettings ? 'text-red-600' : 'text-[#1A1A1A]'
              }`}>
                Retry Settings <span className="text-red-500">*</span>
              </h4>
              {errors.retrySettings && (
                <p className="text-[12px] text-red-600 flex items-center mb-3">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Retry settings are required
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxRetries" className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                    Maximum Retry Attempts
                  </Label>
                  <Select
                    value={campaignData.maxRetryAttempts.toString()}
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, maxRetryAttempts: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 attempt</SelectItem>
                      <SelectItem value="2">2 attempts</SelectItem>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="4">4 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="retryDelay" className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                    Retry Delay
                  </Label>
                  <Select
                    value={campaignData.retryDelayMinutes.toString()}
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, retryDelayMinutes: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">2 minutes</SelectItem>
                      <SelectItem value="15">5 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* SMS Switch Option
            <div className="space-y-4 lg:col-span-2 mt-6 pt-6 border-t border-[#E5E7EB]">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="smsSwitchOnSecondAttempt"
                  checked={campaignData.smsSwitchOnSecondAttempt}
                  onCheckedChange={(checked) => 
                    setCampaignData(prev => ({ ...prev, smsSwitchOnSecondAttempt: checked === true }))
                  }
                  className="border-2 border-[#E5E7EB] data-[state=checked]:bg-[#4600F2] data-[state=checked]:border-[#4600F2]"
                />
                <div>
                  <Label htmlFor="smsSwitchOnSecondAttempt" className="text-[14px] font-medium text-[#1A1A1A] cursor-pointer">
                    Switch to SMS on 2nd attempt if voice fails
                  </Label>
                  <p className="text-[13px] text-[#6B7280] mt-1">
                    Automatically fall back to SMS messaging if voice calls are unsuccessful on the first attempt
                  </p>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Voicemail Strategy */}
        <div className={`bg-white border rounded-lg p-6 transition-colors ${
          errors.voicemailStrategy ? 'border-red-500' : 'border-[#E5E7EB]'
        }`}>
          <div className="space-y-6">
            <div>
              <h3 className={`text-[16px] font-bold ${
                errors.voicemailStrategy ? 'text-red-600' : 'text-[#1A1A1A]'
              }`}>
                Voicemail Strategy <span className="text-red-500">*</span>
              </h3>
              <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Configure how your AI agent handles voicemail scenarios</p>
              {errors.voicemailStrategy && (
                <p className="text-[12px] text-red-600 flex items-center mt-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please select a voicemail strategy
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-[14px] font-medium text-[#1A1A1A] mb-3 block">
                  Voicemail Handling Method
                </Label>
                <Select
                  value={campaignData.voicemailStrategy || 'leave_message'}
                  onValueChange={(value) => setCampaignData(prev => ({ ...prev, voicemailStrategy: value }))}
                >
                  <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave_message">Leave voicemail message</SelectItem>
                    <SelectItem value="hang_up">Hang up</SelectItem>
                    {/* <SelectItem value="transfer">Transfer to human</SelectItem>
                    <SelectItem value="sms_fallback">Send SMS fallback instead</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {campaignData.voicemailStrategy === 'leave_message' && (
                <div>
                  <Label className="text-[14px] font-medium text-[#1A1A1A] mb-2 block">
                    Voicemail Message
                  </Label>
                  <Textarea
                    value={campaignData.voicemailMessage || "Hi, this is [Company Name] calling with some exciting news about your vehicle. We’re offering a special opportunity to upgrade or take advantage of exclusive savings. Please call us back at [Phone Number] to learn how you can benefit. This is a limited-time offer designed to give you the best value on your next vehicle. Thank you, and we look forward to speaking with you."}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, voicemailMessage: e.target.value }))}
                    placeholder="Enter your voicemail message..."
                    className="min-h-[120px] text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20 transition-all duration-200 resize-none"
                  />
                  <p className="text-[13px] text-[#6B7280] mt-2">
                    This message will be left when the AI agent reaches voicemail
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pacing & Limits */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#1A1A1A]">Pacing & Limits</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      type="button"
                      className="inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4600F2] focus:ring-offset-1"
                      aria-label="Information about pacing and limits settings"
                    >
                      <Info className="h-4 w-4 text-[#6B7280] hover:text-[#4600F2] cursor-pointer transition-colors" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="top" 
                    className="w-72 text-center"
                    sideOffset={5}
                  >
                    <p className="text-sm text-gray-700">
                      These settings are from your signed contract. To make changes, please contact your key account manager.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Control the rate and volume of outreach</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-[14px] font-medium text-[#1A1A1A]">Daily Contact Limit</Label>
                  <span className="text-[14px] font-semibold text-[#4600F2]">{campaignData.maxCallsPerDay || 110} contacts/day</span>
                </div>
                <div className="flex items-center space-x-3 opacity-60 blur-[0.5px]">
                  <span className="text-[12px] text-[#6B7280]">10</span>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="10"
                      max="500"
                      value={campaignData.maxCallsPerDay || 110}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, maxCallsPerDay: parseInt(e.target.value) }))}
                      disabled
                      className="w-full h-2 bg-[#4B5563] rounded-full appearance-none cursor-not-allowed pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, #4B5563 0%, #4B5563 ${((campaignData.maxCallsPerDay || 110) - 10) / (500 - 10) * 100}%, #D1D5DB ${((campaignData.maxCallsPerDay || 110) - 10) / (500 - 10) * 100}%, #D1D5DB 100%)`
                      }}
                    />
                  </div>
                  <span className="text-[12px] text-[#6B7280]">500</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-[14px] font-medium text-[#1A1A1A]">Hourly Throttle</Label>
                  <span className="text-[14px] font-semibold text-[#4600F2]">{campaignData.maxCallsPerHour || 10} contacts/hour</span>
                </div>
                <div className="flex items-center space-x-3 opacity-60 blur-[0.5px]">
                  <span className="text-[12px] text-[#6B7280]">1</span>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={campaignData.maxCallsPerHour || 10}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, maxCallsPerHour: parseInt(e.target.value) }))}
                      disabled
                      className="w-full h-2 bg-[#4B5563] rounded-full appearance-none cursor-not-allowed pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, #4B5563 0%, #4B5563 ${((campaignData.maxCallsPerHour || 10) - 1) / (50 - 1) * 100}%, #D1D5DB ${((campaignData.maxCallsPerHour || 10) - 1) / (50 - 1) * 100}%, #D1D5DB 100%)`
                      }}
                    />
                  </div>
                  <span className="text-[12px] text-[#6B7280]">50</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-[14px] font-medium text-[#1A1A1A]">Max Concurrent Calls</Label>
                  <span className="text-[14px] font-semibold text-[#4600F2]">{campaignData.maxConcurrentCalls || 5} concurrent</span>
                </div>
                <div className="flex items-center space-x-3 opacity-60 blur-[0.5px]">
                  <span className="text-[12px] text-[#6B7280]">1</span>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={campaignData.maxConcurrentCalls || 5}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, maxConcurrentCalls: parseInt(e.target.value) }))}
                      disabled
                      className="w-full h-2 bg-[#D1D5DB] rounded-full appearance-none cursor-not-allowed pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, #4B5563 0%, #4B5563 ${((campaignData.maxConcurrentCalls || 5) - 1) / (20 - 1) * 100}%, #D1D5DB ${((campaignData.maxConcurrentCalls || 5) - 1) / (20 - 1) * 100}%, #D1D5DB 100%)`
                      }}
                    />
                  </div>
                  <span className="text-[12px] text-[#6B7280]">20</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </TooltipProvider>
  )
}
