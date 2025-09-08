'use client'

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

interface StepNavigationProps {
  currentStep: number
  maxStep: number
  isLaunching: boolean
  selectedCategory: string
  isContinueDisabled: () => boolean
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
  onPrevStep,
  onNextStep,
  onCancel
}: StepNavigationProps) {
  const getButtonText = () => {
    if (isLaunching) return 'Starting...'
    if (currentStep === 3) {
      return 'Start Campaign'
    }
    return 'Continue'
  }

  if (currentStep >= maxStep) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-50 shadow-lg px-6 py-4">
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
              onClick={onPrevStep}
              variant="outline"
              size="lg"
              className="h-11 px-4 text-[14px] border-[#E5E7EB] text-[#6B7280] hover:bg-[#4600F214] rounded-lg font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          <Button
            onClick={onNextStep}
            disabled={isContinueDisabled()}
            size="lg"
            className="h-11 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}
