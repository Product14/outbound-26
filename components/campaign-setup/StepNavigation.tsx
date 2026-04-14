'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, X, AlertCircle } from 'lucide-react'

interface StepNavigationProps {
  currentStep: number
  maxStep: number
  isLaunching: boolean
  selectedCategory: string
  isContinueDisabled: () => boolean
  getMissingFields?: () => string[]
  isRecurring?: boolean
  onPrevStep: () => void
  onNextStep: () => void
  onCancel: () => void
}

export default function StepNavigation({
  currentStep,
  maxStep,
  isLaunching,
  selectedCategory,
  isContinueDisabled,
  getMissingFields,
  isRecurring,
  onPrevStep,
  onNextStep,
  onCancel
}: StepNavigationProps) {
  const [showGuide, setShowGuide] = useState(false)

  const getButtonText = () => {
    if (isLaunching) return isRecurring ? 'Activating...' : 'Launching...'
    if (currentStep === 5) {
      return isRecurring ? 'Activate Recurring' : 'Launch Campaign'
    }
    return 'Continue'
  }

  if (currentStep >= maxStep) return null

  const disabled = isContinueDisabled()
  const missing = disabled && getMissingFields ? getMissingFields() : []

  const handleContinueClick = () => {
    if (disabled && missing.length > 0) {
      setShowGuide(true)
      return
    }
    setShowGuide(false)
    onNextStep()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Guidance banner — slides up when Continue is disabled and clicked */}
      {showGuide && missing.length > 0 && (
        <div className="bg-[#FEF2F2] border-t border-[#FECACA] px-6 py-3">
          <div className="flex items-start gap-2 max-w-3xl ml-64">
            <AlertCircle className="h-4 w-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#991B1B] mb-1">
                Please complete the following to continue:
              </p>
              <ul className="space-y-0.5">
                {missing.map((field, i) => (
                  <li key={i} className="text-xs text-[#B91C1C] flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#DC2626] flex-shrink-0" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="p-1 rounded hover:bg-[#FEE2E2] text-[#991B1B] flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation bar */}
      <div className="bg-white border-t border-[#E5E7EB] shadow-lg px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Cancel Button - Left Side */}
          <Button
            onClick={onCancel}
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
                onClick={() => { setShowGuide(false); onPrevStep() }}
                variant="outline"
                size="lg"
                className="h-11 px-4 text-[14px] border-[#E5E7EB] text-[#6B7280] hover:bg-[#4600F214] rounded-lg font-medium"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <Button
              onClick={handleContinueClick}
              size="lg"
              className={`h-11 px-4 text-[14px] rounded-lg font-medium ${
                disabled
                  ? 'bg-[#4600F2]/50 text-white/80 cursor-pointer'
                  : 'bg-[#4600F2] hover:bg-[#4600F2]/90 text-white'
              }`}
            >
              {getButtonText()}
              {isLaunching ? (
                <div className="animate-spin h-5 w-5 ml-2 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <ArrowRight className="h-5 w-5 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
