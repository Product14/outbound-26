'use client'

import { CheckCircle } from 'lucide-react'
import { SetupStep } from '@/types/campaign-setup'

interface StepperSidebarProps {
  steps: SetupStep[]
  currentStep: number
}

export default function StepperSidebar({ steps, currentStep }: StepperSidebarProps) {
  return (
    <div className="fixed left-0 top-0 w-64 h-full bg-white border-r border-[#E5E7EB] p-6 z-10 overflow-y-auto">
      <div className="space-y-8">
        <div>
          <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-6 leading-[1.4]">Setup Progress</h3>
          <div className="flex flex-col space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start min-w-0 flex-shrink-0">
                <div className="flex flex-col items-center mr-4">
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
                    <div className={`w-0.5 h-12 mt-4 ${
                      currentStep > step.id ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'
                    }`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-[14px] font-medium whitespace-nowrap lg:whitespace-normal leading-[1.5] ${
                    currentStep >= step.id ? 'text-[#1A1A1A]' : 'text-[#6B7280]'
                  }`}>
                    {step.name}
                  </h4>
                  <p className={`text-[12px] mt-1 leading-[1.5] ${
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
  )
}
