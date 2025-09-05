"use client"

import React, { useState, useEffect } from 'react'
import { TranscriptEntry, CallRecord } from '@/types/call-record'
import { Badge } from '@/components/ui/badge'
import { getCustomerInitials } from '@/lib/utils'

interface LiveTranscriptProps {
  transcript?: TranscriptEntry[]
  currentTime: number // Current playback time in seconds
  className?: string
  style?: React.CSSProperties
  agentName?: string // Add agent name prop
  onTranscriptClick?: (timestamp: number) => void // Add click handler
  isPlaying?: boolean // Add playing state
  call?: CallRecord // Add call record to get customer details
}

export function LiveTranscript({ transcript = [], currentTime, className = "", style, agentName, onTranscriptClick, isPlaying = false, call }: LiveTranscriptProps) {
  const [currentEntry, setCurrentEntry] = useState<TranscriptEntry | null>(null)

  useEffect(() => {
    // Safety check: ensure transcript is valid array
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      setCurrentEntry(null)
      return
    }

    // Safety check: ensure currentTime is valid number
    if (typeof currentTime !== 'number' || isNaN(currentTime)) {
      setCurrentEntry(null)
      return
    }

    // Find the current transcript entry based on audio time using secondsFromStart
    // Show only ONE card at a time based on current playback position
    const current = transcript.find((entry, index) => {
      // Safety check: ensure entry is valid
      if (!entry || typeof entry.timestamp !== 'number' || isNaN(entry.timestamp)) {
        return false
      }
      
      const nextEntry = transcript[index + 1]
      // Current entry is active if:
      // 1. We're past its start time AND
      // 2. Either there's no next entry OR we haven't reached the next entry's start time
      return currentTime >= entry.timestamp && (!nextEntry || currentTime < nextEntry.timestamp)
    })

    setCurrentEntry(current || null)
  }, [currentTime, transcript])

  if (!transcript.length) {
    return (
      <div className={`p-3 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-gray-500 italic">No transcript available</p>
      </div>
    )
  }

  const getSpeakerBadgeColor = (speaker: string) => {
    if (speaker.toLowerCase().includes('agent') || speaker.toLowerCase().includes('ai')) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-green-100 text-green-800'
  }

  const getSpeakerInitials = (speaker: string) => {
    if (speaker.toLowerCase().includes('agent') || speaker.toLowerCase().includes('ai')) {
      // Use real agent name if available, otherwise fall back to 'A' for Agent
      if (agentName && typeof agentName === 'string' && agentName.trim() !== '') {
        const words = agentName.trim().split(' ')
        if (words.length >= 2) {
          return words[0][0].toUpperCase() + words[1][0].toUpperCase()
        }
        return agentName[0]?.toUpperCase() || 'A'
      }
      return 'A' // Fallback to 'A' for Agent instead of hardcoded 'AI'
    }
    
    // For customer speakers, use actual customer name if call record is available
    if (call) {
      return getCustomerInitials(call)
    }
    
    // Fallback: Extract initials from speaker name if no call record
    if (speaker && typeof speaker === 'string') {
      const words = speaker.trim().split(' ')
      if (words.length >= 2) {
        return words[0][0].toUpperCase() + words[1][0].toUpperCase()
      }
      return speaker[0]?.toUpperCase() || 'C'
    }
    return 'C' // Fallback for invalid speaker
  }

  // Show only ONE transcript card at a time
  if (!currentEntry || !currentEntry.speaker || !currentEntry.text) {
    return (
      <div className={`overflow-y-auto ${className}`} style={{ maxHeight: '120px', ...style }}>
        <div 
          className="border rounded-xl overflow-hidden bg-white border-gray-200 shadow-sm opacity-0"
          style={{
            animation: 'fadeIn 0.3s ease-out forwards'
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-center py-4">
              <p 
                className="text-sm text-gray-500 italic opacity-0"
                style={{
                  animation: 'fadeIn 0.5s ease-out 0.1s forwards'
                }}
              >
                {currentTime === 0 ? 'Press play to see transcript' : 'No transcript for current time'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`overflow-y-auto ${className}`} style={{ maxHeight: '120px', ...style }}>
      {/* Show ONLY the current transcript entry - matching call drawer style with smooth animations */}
      <div 
        key={`transcript-${currentEntry.timestamp}-${currentEntry.speaker}`}
        className={`border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md animate-fade-in-up opacity-0 ${
          isPlaying 
            ? 'shadow-md' 
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
        style={{
          animation: 'fadeInUp 0.5s ease-out forwards',
          backgroundColor: isPlaying ? 'rgba(70, 0, 242, 0.1)' : undefined,
          borderColor: isPlaying ? '#4600f2' : undefined
        }}
        onClick={() => {
          if (onTranscriptClick && currentEntry.timestamp) {
            onTranscriptClick(currentEntry.timestamp)
          }
        }}
        title={currentEntry.timestamp ? `Click to play from ${Math.floor(currentEntry.timestamp / 60)}:${Math.floor(currentEntry.timestamp % 60).toString().padStart(2, '0')}` : "No timestamp available"}
      >
        <div className="p-4">
          <div className="flex gap-3">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold
                          transition-all duration-300 ease-out opacity-0 ${
                isPlaying 
                  ? 'bg-[#4600f2] text-white' 
                  : (currentEntry.speaker.toLowerCase().includes('agent') || currentEntry.speaker.toLowerCase().includes('ai') 
                      ? 'bg-purple-200 text-purple-700 hover:bg-[#4600f2] hover:text-white' 
                      : 'bg-green-200 text-green-700 hover:bg-green-300')
              }`}
              style={{
                animation: 'fadeInScale 0.4s ease-out 0.1s forwards'
              }}
            >
              {getSpeakerInitials(currentEntry.speaker)}
            </div>
            <div 
              className="flex-1 opacity-0"
              style={{
                animation: 'fadeInRight 0.4s ease-out 0.2s forwards'
              }}
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className={`font-semibold transition-colors duration-200 ${
                  isPlaying ? 'text-[#4600f2]' : 'text-gray-900 hover:text-[#4600f2]'
                }`}>
                  {currentEntry.speaker.toLowerCase().includes('agent') || currentEntry.speaker.toLowerCase().includes('ai') ? 'Agent' : currentEntry.speaker}
                </span>
                <span className={`text-xs transition-colors duration-200 ${
                  isPlaying ? 'text-[#4600f2]/80' : 'text-gray-500 hover:text-[#4600f2]/80'
                }`}>
                  {Math.floor(currentEntry.timestamp / 60)}:{Math.floor(currentEntry.timestamp % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className={`leading-relaxed break-words transition-colors duration-200 font-medium ${
                isPlaying ? 'text-[#4600f2] font-medium' : 'text-gray-700 hover:text-[#4600f2]'
              }`}>
                {currentEntry.text}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
