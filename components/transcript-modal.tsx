"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { getCustomerDisplayName, getCustomerInitials } from "@/lib/utils"
import type { CallRecord } from "@/types/call-record"

interface TranscriptModalProps {
  call: CallRecord | null
  onClose: () => void
  getAgentDetails: (callId: string) => { name: string; avatar: string }
}

export const TranscriptModal = React.memo(function TranscriptModal({ call, onClose, getAgentDetails }: TranscriptModalProps) {
  if (!call) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card-surface rounded-xl-custom p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-page-heading" style={{ color: 'var(--text-primary)' }}>Call Transcript</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg-custom p-4" style={{ backgroundColor: 'var(--background)' }}>
            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
              Customer: {getCustomerDisplayName(call)}
            </p>

            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Duration: 2:34</p>
            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Agent: {getAgentDetails(call.call_id).name}</p>
          </div>
          <div className="space-y-4">
            {call.transcript && call.transcript.length > 0 ? (
              call.transcript.map((entry, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-small font-semibold" 
                       style={{ backgroundColor: entry.speaker.toLowerCase().includes('agent') ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {entry.speaker.toLowerCase().includes('agent') ? getAgentDetails(call.call_id).avatar : getCustomerInitials(call)}
                  </div>
                  <div className="flex-1">
                    <p className="text-body" style={{ color: 'var(--text-primary)' }}>{entry.text}</p>
                    {entry.timestamp && (
                      <span className="text-small" style={{ color: 'var(--text-secondary)' }}>
                        {Math.floor(entry.timestamp / 60)}:{Math.floor(entry.timestamp % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>No transcript available for this call</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
