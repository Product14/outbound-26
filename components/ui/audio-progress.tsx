"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioProgressProps {
  callId: string
  isPlaying: boolean
  onTogglePlay: (callId: string) => void
  duration?: number // Duration in seconds
  className?: string
  showPlayButton?: boolean // Whether to show the play/pause button

}

export function AudioProgress({ 
  callId, 
  isPlaying, 
  onTogglePlay, 
  duration = 180, // Default 3 minutes
  className,
  showPlayButton = true
}: AudioProgressProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1
          if (newTime >= duration) {
            onTogglePlay(callId) // Auto-stop when duration is reached
            return duration
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, duration, callId, onTogglePlay])

  useEffect(() => {
    setProgress((currentTime / duration) * 100)
  }, [currentTime, duration])

  // Removed the effect that resets progress when paused
  // This allows the progress to remain visible when audio is paused

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickPercentage = clickX / rect.width
    const newTime = Math.floor(clickPercentage * duration)
    
    setCurrentTime(Math.max(0, Math.min(duration, newTime)))
  }

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      {showPlayButton && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 rounded-full flex-shrink-0 transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: '#4600f2',
            borderColor: '#4600f2',
            color: 'white'
          }}
          onClick={() => onTogglePlay(callId)}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3 text-white fill-white" />
          ) : (
            <Play className="h-3 w-3 text-white fill-white" />
          )}
        </Button>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        {/* Clickable Progress Bar */}
        <div 
          ref={progressBarRef}
          className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden cursor-pointer hover:h-2 transition-all duration-200"
          onClick={handleProgressBarClick}
        >
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)'
            }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between items-center text-xs" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          <span className="font-medium">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
