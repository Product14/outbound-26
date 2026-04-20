import React, { useState, useRef, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Play, Pause, Calendar, Car, User, Phone, PhoneCall, Clock, ChevronDown, ChevronRight, ChevronUp, Edit, X, Bot, AlertCircle, Wrench, Mail, FileText, Tag, MapPin, Loader2, Download, RotateCcw, ArrowDown, MessageSquare, Zap, Star, Activity, BarChart2 } from "lucide-react"
import AudioPlayer from "@/components/ui/audio-player"
import { RightPanelShimmer } from "@/components/ui/right-panel-shimmer"
import { useEndCallReport, type EndCallReportData } from "@/hooks/use-end-call-report"
import type { CallRecord } from "@/types/call-record"

interface ApiCallDrawerProps {
  call: CallRecord | null
  open: boolean
  onClose: () => void
  onPlayStateChange?: (call: CallRecord, isPlaying: boolean) => void
  isPlaying: boolean
  audioRef: any // external ref from parent to control drawer audio
  autoStartPlayback?: boolean
  autoStartKey?: number
  onAutoStartComplete?: () => void
  initialTab?: 'highlights' | 'customer' | 'summary' | 'appointment' | 'sms' | 'transcript'
  autoScrollToSummary?: boolean
  autoScrollTo?: 'highlights' | 'customer' | 'summary' | 'appointment' | 'sms' | 'transcript' | null
  hideTranscript?: boolean
}

function StandaloneCallCard({ postCall }: { postCall: { startedAt: string; duration: string; outcome: string; recordingUrl?: string } }) {
  const demoUrl = postCall.recordingUrl || ''

  return (
    <div className="rounded-[8px] border overflow-hidden" style={{ borderColor: 'rgba(199,210,254,0.6)' }}>
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: 'rgba(244,243,255,0.8)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#3658c7]">
          <PhoneCall className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-[#3658c7] leading-tight">Standalone Call</span>
            <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(0,0,0,0.5)' }}>{postCall.startedAt} · {postCall.duration}</span>
          </div>
          <p className="text-[11px] leading-tight" style={{ color: 'rgba(10,10,10,0.6)' }}>{postCall.outcome}</p>
        </div>
      </div>
      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'rgba(199,210,254,0.6)' }} />
      {/* Audio player */}
      <div className="px-3 py-2" style={{ backgroundColor: '#f9fafb' }}>
        <AudioPlayer
          key="standalone-call-player"
          audioUrl={demoUrl}
          showWaveform={true}
          autoPlay={false}
          hideControls={false}
          hideSeekButtons={true}
        />
      </div>
    </div>
  )
}

export function ApiCallDrawer({
  call, 
  open, 
  onClose, 
  onPlayStateChange, 
  isPlaying, 
  audioRef,
  autoStartPlayback = false,
  autoStartKey = 0,
  onAutoStartComplete,
  initialTab = 'highlights',
  autoScrollToSummary = false,
  autoScrollTo = null,
  hideTranscript = false
}: ApiCallDrawerProps) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'customer' | 'summary' | 'appointment' | 'sms' | 'transcript'>(initialTab)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [actualAudioDuration, setActualAudioDuration] = useState(0)
  const transcriptAnchorRef = useRef<HTMLDivElement | null>(null)
  
  // Refs for tracking currently playing transcript entry
  const currentTranscriptEntryRef = useRef<HTMLDivElement | null>(null)
  
  // State for managing auto-scroll behavior
  const [autoScrollDisabled, setAutoScrollDisabled] = useState(false)
  const [userIsScrolling, setUserIsScrolling] = useState(false)
  const lastActiveTabRef = useRef(activeTab)
  const programmaticScrollRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // State for showing jump button when user scrolls during playback
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [isActiveTranscriptInView, setIsActiveTranscriptInView] = useState(true)
  const visibilityCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastVisibilityStateRef = useRef(true)
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null)
  const jumpButtonDebounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Debug logging to verify call_id and agent info being passed
  React.useEffect(() => {
    if (open && call) {
      
    }
  }, [open, call])

  // Fetch detailed call data when drawer opens using the new API
  const { reportData, loading: detailsLoading, error: detailsError, retry } = useEndCallReport(open && call ? call.call_id : null)
  
  // Reset active tab when drawer opens with new initialTab
  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

  // Auto-scroll to summary section when autoScrollToSummary is true
  React.useEffect(() => {
    if (open && autoScrollToSummary && initialTab === 'summary') {
      // Wait for the drawer to fully open and content to render
      setTimeout(() => {
        scrollToSection(summarySectionRef, 'summary')
      }, 500) // Delay to ensure drawer animation and content loading is complete
    }
  }, [open, autoScrollToSummary, initialTab])
  
  // Refs for scrolling to sections within Overview tab
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const highlightsSectionRef = useRef<HTMLDivElement | null>(null)
  const customerSectionRef = useRef<HTMLDivElement | null>(null)
  const summarySectionRef = useRef<HTMLDivElement | null>(null)
  const appointmentSectionRef = useRef<HTMLDivElement | null>(null)
  const smsSectionRef = useRef<HTMLDivElement | null>(null)
  const transcriptSectionRef = useRef<HTMLDivElement | null>(null)
  
  // Ref for the audio player
  const drawerAudioPlayerRef = useRef<any>(null)

  // Expose internal audio player ref to parent so outside controls can pause/play
  React.useEffect(() => {
    if (audioRef && typeof audioRef === 'object') {
      audioRef.current = drawerAudioPlayerRef.current
    }
  }, [audioRef, drawerAudioPlayerRef.current])
  
  // Function to scroll to section and update active tab
  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement | null>, tabName: 'highlights' | 'customer' | 'summary' | 'appointment' | 'sms' | 'transcript') => {
    if (sectionRef.current && scrollContainerRef.current) {
      // Disable auto-scroll when user manually navigates to a section
      setAutoScrollDisabled(true)
      
      // Mark as programmatic scroll to avoid triggering user scroll detection
      programmaticScrollRef.current = true
      setActiveTab(tabName)
      
      // Calculate precise scroll position to align section top with tab bottom
      const container = scrollContainerRef.current
      const sectionElement = sectionRef.current
      
      // Get the sticky header to calculate tab bottom position
      const stickyHeader = container.querySelector('.sticky') as HTMLElement
      let headerHeight = 200 // Default fallback
      
      if (stickyHeader) {
        headerHeight = stickyHeader.offsetHeight
      }
      
      // Calculate the target scroll position
      const containerRect = container.getBoundingClientRect()
      const sectionRect = sectionElement.getBoundingClientRect()
      const currentScrollTop = container.scrollTop
      
      // Position the section top just below the sticky header (with small padding)
      const targetScrollTop = currentScrollTop + (sectionRect.top - containerRect.top) - headerHeight - 20
      
      // Smooth scroll to the calculated position
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      })
      
      // Reset programmatic scroll flag after scroll completes
      setTimeout(() => {
        programmaticScrollRef.current = false
        // Re-enable auto-scroll after manual navigation to allow natural scrolling behavior
        setAutoScrollDisabled(false)
      }, 1000)
    }
  }

  // Function to scroll to a specific transcript entry based on timestamp
  const scrollToTranscriptAtTime = (targetTime: number) => {
    if (!normalizedTranscript.length || !scrollContainerRef.current) return

    // Find the transcript entry that corresponds to the target time
    let targetEntryIndex = normalizedTranscript.findIndex((entry, index) => {
      if (typeof entry.timestamp !== 'number') return false

      const nextEntry = normalizedTranscript[index + 1]
      // Target entry is the one where:
      // 1. We're past its start time AND
      // 2. Either there's no next entry OR we haven't reached the next entry's start time
      return targetTime >= entry.timestamp && (!nextEntry || !nextEntry.timestamp || targetTime < nextEntry.timestamp)
    })

    // If playback time is before the first timestamp, snap to the first entry
    if (targetEntryIndex < 0) {
      const firstTs = normalizedTranscript[0]?.timestamp
      const lastTs = normalizedTranscript[normalizedTranscript.length - 1]?.timestamp
      if (typeof firstTs === 'number' && targetTime < firstTs) {
        targetEntryIndex = 0
      } else if (typeof lastTs === 'number' && targetTime >= lastTs) {
        targetEntryIndex = normalizedTranscript.length - 1
      } else {
        targetEntryIndex = 0
      }
    }

    // Ensure we have a valid index
    if (targetEntryIndex < 0 || targetEntryIndex >= normalizedTranscript.length) {
      targetEntryIndex = 0
    }

    // Find the DOM element for this transcript entry
    const transcriptEntries = scrollContainerRef.current.querySelectorAll('[data-transcript-entry]')
    const targetElement = transcriptEntries[targetEntryIndex] as HTMLElement

    if (targetElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const containerRect = container.getBoundingClientRect()
      const elRect = targetElement.getBoundingClientRect()
      
      // Find the tab navigation area to calculate the actual viewport start
      const tabNavigation = container.querySelector('nav') as HTMLElement
      let viewportOffset = 100 // Default fallback
      
      if (tabNavigation) {
        const tabRect = tabNavigation.getBoundingClientRect()
        viewportOffset = tabRect.bottom - containerRect.top + 10 // Small padding after tabs
      } else {
        // Fallback: use sticky header if tabs not found
        const stickyHeader = container.querySelector('.sticky') as HTMLElement
        if (stickyHeader) {
          viewportOffset = stickyHeader.offsetHeight + 20
        }
      }
      
      // Calculate precise scroll position to position card below the tabs
      const currentScrollTop = container.scrollTop
      const targetScrollTop = currentScrollTop + (elRect.top - containerRect.top) - viewportOffset
      
      // Check if at least half of the card is already visible using the same logic
      const cardHeight = elRect.height
      const cardTop = elRect.top
      const cardBottom = elRect.bottom
      const viewportTop = tabNavigation ? tabNavigation.getBoundingClientRect().bottom : containerRect.top + viewportOffset
      const viewportBottom = containerRect.bottom - 20
      
      const visibleTop = Math.max(cardTop, viewportTop)
      const visibleBottom = Math.min(cardBottom, viewportBottom)
      const visibleHeight = Math.max(0, visibleBottom - visibleTop)
      const isAlreadyInView = visibleHeight >= (cardHeight / 2)
      
      if (!isAlreadyInView) {
        container.scrollTo({ 
          top: Math.max(0, targetScrollTop), 
          behavior: 'smooth' 
        })
      }
    }
  }

  // Function to jump to the currently playing transcript entry
  const handleJumpToCurrentPosition = () => {
    if (!isPlaying || !normalizedTranscript.length) return
    
    // Hide the jump button immediately when clicked
    setShowJumpButton(false)
    setIsActiveTranscriptInView(true) // Assume it will be in view after jump
    
    // Mark as programmatic scroll to prevent interference
    programmaticScrollRef.current = true
    
    // Re-enable auto-scroll and clear user scrolling state
    setAutoScrollDisabled(false)
    setUserIsScrolling(false)
    
    const wasOnTranscriptTab = activeTab === 'transcript'
    
    // Switch to transcript tab if not already there
    if (!wasOnTranscriptTab) {
      setActiveTab('transcript')
    }
    
    // Execute the scroll with appropriate timing
    const executeScroll = () => {
      if (!scrollContainerRef.current) {
        programmaticScrollRef.current = false
        return
      }
      
      // First, ensure we're in the transcript section
      if (transcriptSectionRef.current) {
        const container = scrollContainerRef.current
        const transcriptSection = transcriptSectionRef.current
        const containerRect = container.getBoundingClientRect()
        const sectionRect = transcriptSection.getBoundingClientRect()
        
        // Calculate if transcript section is not visible
        const sectionNotVisible = (
          sectionRect.top > containerRect.bottom || 
          sectionRect.bottom < containerRect.top
        )
        
        if (sectionNotVisible) {
          // Scroll to transcript section first
          const stickyHeader = container.querySelector('.sticky') as HTMLElement
          const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 200
          const currentScrollTop = container.scrollTop
          const targetScrollTop = currentScrollTop + (sectionRect.top - containerRect.top) - headerHeight - 20
          
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
          })
          
          // Wait for section scroll to complete, then scroll to specific entry
          setTimeout(() => {
            scrollToTranscriptAtTime(currentPlaybackTime)
            programmaticScrollRef.current = false
          }, 600)
          return
        }
      }
      
      // If transcript section is already visible, directly scroll to the current entry
      scrollToTranscriptAtTime(currentPlaybackTime)
      programmaticScrollRef.current = false
    }
    
    // Execute with appropriate delay based on whether we switched tabs
    if (wasOnTranscriptTab) {
      // Already on transcript tab, scroll immediately
      setTimeout(executeScroll, 50)
    } else {
      // Switched tabs, wait for tab switch to complete
      setTimeout(executeScroll, 200)
    }
  }

  // Function to download the audio file
  const handleDownloadAudio = async () => {
    const audioUrl = reportData?.recordingUrl
    if (!audioUrl || !call) return

    try {
      // Fetch the audio file as a blob
      const response = await fetch(audioUrl)
      if (!response.ok) throw new Error('Failed to fetch audio file')
      
      const blob = await response.blob()
      
      // Create a blob URL and download it
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `call-${call.call_id}-audio.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Failed to download audio:', error)
      // Fallback to the original method if fetch fails
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `call-${call.call_id}-audio.wav`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Function to restart audio from the beginning
  const handleRestartAudio = () => {
    if (!call || !drawerAudioPlayerRef.current) return

    try {
      // Seek to the beginning (0 seconds)
      if (drawerAudioPlayerRef.current.seek) {
        drawerAudioPlayerRef.current.seek(0)
        setCurrentPlaybackTime(0)
      }
      
      // Start playing from the beginning
      if (drawerAudioPlayerRef.current.play) {
        drawerAudioPlayerRef.current.play()
        // Inform parent that drawer started playing
        if (typeof onPlayStateChange === 'function') onPlayStateChange(call, true)
      }
    } catch (error) {
      console.error('Failed to restart audio:', error)
    }
  }

  // Helper function to normalize transcript data from API
  const getNormalizedTranscript = React.useCallback(() => {
    if (!reportData?.transcript) return []
    
    try {
      // Use API transcript data directly
      return reportData.transcript.map((entry, index) => ({
        speaker: entry.speaker,
        text: entry.text,
        timestamp: entry.timestamp,
        duration: entry.duration
      }))
    } catch (error) {
      console.error('Error normalizing transcript:', error)
      return []
    }
  }, [reportData])

  const normalizedTranscript = React.useMemo(() => getNormalizedTranscript(), [getNormalizedTranscript])

  // Function to check if the active transcript entry is in viewport (debounced)
  const checkActiveTranscriptVisibility = React.useCallback(() => {
    // Clear any existing timeout to prevent multiple rapid checks
    if (visibilityCheckTimeoutRef.current) {
      clearTimeout(visibilityCheckTimeoutRef.current)
    }

    visibilityCheckTimeoutRef.current = setTimeout(() => {
      if (!isPlaying || !normalizedTranscript.length || !currentTranscriptEntryRef.current || !scrollContainerRef.current) {
        setIsActiveTranscriptInView(true)
        return
      }

      const container = scrollContainerRef.current
      const activeElement = currentTranscriptEntryRef.current
      const containerRect = container.getBoundingClientRect()
      const elementRect = activeElement.getBoundingClientRect()
      
      // Find the tab navigation area to calculate the actual viewport start
      const tabNavigation = container.querySelector('nav') as HTMLElement
      let viewportTop = containerRect.top
      
      if (tabNavigation) {
        const tabRect = tabNavigation.getBoundingClientRect()
        viewportTop = tabRect.bottom // Viewport starts right after the tabs
      } else {
        // Fallback: use sticky header if tabs not found
        const stickyHeader = container.querySelector('.sticky') as HTMLElement
        if (stickyHeader) {
          viewportTop = containerRect.top + stickyHeader.offsetHeight
        }
      }
      
      // Calculate if at least half of the transcript card is visible in the actual viewport
      const cardHeight = elementRect.height
      const cardTop = elementRect.top
      const cardBottom = elementRect.bottom
      const viewportBottom = containerRect.bottom - 20 // Small padding from bottom
      
      // Check how much of the card is visible
      const visibleTop = Math.max(cardTop, viewportTop)
      const visibleBottom = Math.min(cardBottom, viewportBottom)
      const visibleHeight = Math.max(0, visibleBottom - visibleTop)
      
      // Card is considered "in view" if at least half of it is visible
      const isInView = visibleHeight >= (cardHeight / 2)
      
      // Only update state if the visibility actually changed
      if (lastVisibilityStateRef.current !== isInView) {
        lastVisibilityStateRef.current = isInView
        // Use functional update to prevent unnecessary re-renders
        setIsActiveTranscriptInView(prev => {
          if (prev !== isInView) {
            return isInView
          }
          return prev
        })
      }
    }, 500) // Increase debounce to 500ms for better stability and reduced flickering
  }, [isPlaying, normalizedTranscript.length])

  // Enhanced user scroll detection to disable auto-scroll during manual scrolling
  React.useEffect(() => {
    if (!scrollContainerRef.current || !open) return

    const container = scrollContainerRef.current
    
    const handleUserScroll = () => {
      // Ignore programmatic scrolls (like when play button is clicked)
      if (programmaticScrollRef.current) {
        return
      }
      
      // Set user is actively scrolling - this immediately prevents auto-scroll
      setUserIsScrolling(true)
      
      // Throttle visibility checks to prevent rapid state changes
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current)
      }
      
      scrollThrottleRef.current = setTimeout(() => {
        // Check visibility only if we're playing and have transcript data
        if (isPlaying && normalizedTranscript.length > 0) {
          checkActiveTranscriptVisibility()
        }
      }, 200) // Throttle visibility checks to every 200ms during scroll to reduce flickering
      
      // Clear any existing timeout
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
      }
      
      // Set a timeout to detect when user stops scrolling
      userScrollTimeoutRef.current = setTimeout(() => {
        setUserIsScrolling(false)
        // Final visibility check after user stops scrolling
        if (isPlaying && normalizedTranscript.length > 0) {
          checkActiveTranscriptVisibility()
        }
        // Only permanently disable auto-scroll if user scrolled for more than 1 second
        // This allows for brief scrolls without permanently disabling auto-scroll
      }, 1500) // 1.5 seconds after user stops scrolling, allow auto-scroll again
    }

    container.addEventListener('scroll', handleUserScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleUserScroll)
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
      }
    }
  }, [open, isPlaying, activeTab, normalizedTranscript.length])

  // Detect tab changes to disable auto-scroll (but ignore programmatic changes)
  React.useEffect(() => {
    if (lastActiveTabRef.current !== activeTab) {
      // Ignore programmatic tab changes (like when play button is clicked)
      if (!programmaticScrollRef.current) {
        setAutoScrollDisabled(true)
      }
    }
    lastActiveTabRef.current = activeTab
  }, [activeTab])

  // Precise tab switching based on section top edge vs tab bottom position
  React.useEffect(() => {
    if (!scrollContainerRef.current || !open) return

    const sections = [
      { ref: highlightsSectionRef, tab: 'highlights' as const },
      { ref: summarySectionRef, tab: 'summary' as const },
      { ref: appointmentSectionRef, tab: 'appointment' as const },
      { ref: smsSectionRef, tab: 'sms' as const },
      { ref: transcriptSectionRef, tab: 'transcript' as const }
    ]

    let debounceTimeout: NodeJS.Timeout

    const updateActiveTabPrecise = () => {
      // Only update if not programmatic scroll
      if (programmaticScrollRef.current) return

      const container = scrollContainerRef.current
      if (!container) return

      // Get the sticky header element to calculate its actual height
      const stickyHeader = container.querySelector('.sticky') as HTMLElement
      let tabBottomPosition = 0

      if (stickyHeader) {
        // Use the actual sticky header height
        const stickyRect = stickyHeader.getBoundingClientRect()
        tabBottomPosition = stickyRect.bottom
      } else {
        // Fallback to container top + estimated height
        const containerRect = container.getBoundingClientRect()
        tabBottomPosition = containerRect.top + 200 // Estimated height of header + audio + tabs
      }

      // Find which section should be active based on scroll position
      let newActiveTab = activeTab
      let bestSection = null
      let minDistance = Infinity

      // Check all sections to find the one closest to the tab bottom line
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        if (section.ref.current) {
          const sectionRect = section.ref.current.getBoundingClientRect()
          
          // Calculate distance from section top to tab bottom line
          const distance = Math.abs(sectionRect.top - tabBottomPosition)
          
          // If this section is above or at the tab bottom line, it's a candidate
          if (sectionRect.top <= tabBottomPosition + 10) {
            // Choose the section with the smallest distance (closest to tab bottom)
            if (distance < minDistance) {
              minDistance = distance
              bestSection = section
            }
          }
        }
      }

      // If we found a suitable section, use it
      if (bestSection) {
        newActiveTab = bestSection.tab
      } else {
        // Fallback: if no section is above the tab bottom line, 
        // find the first section that's visible (for cases when scrolled to very top)
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          if (section.ref.current) {
            const sectionRect = section.ref.current.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()
            
            // Check if section is visible in the viewport
            if (sectionRect.top < containerRect.bottom && sectionRect.bottom > containerRect.top) {
              newActiveTab = section.tab
              break
            }
          }
        }
      }

      // Update active tab if it changed and is valid
      if (newActiveTab !== activeTab && newActiveTab) {
        setActiveTab(newActiveTab)
      }
    }

    // Debounced scroll handler for better performance
    const handleScroll = () => {
      if (programmaticScrollRef.current) return
      
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(updateActiveTabPrecise, 30) // Even faster response for better UX
    }

    // Update immediately on mount
    const timeoutId = setTimeout(updateActiveTabPrecise, 300)

    // Listen for scroll events
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(debounceTimeout)
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [open, call, activeTab])
  
  // Keep playback time when paused - only reset when drawer closes or call changes
  React.useEffect(() => {
    // Reset playback time when drawer closes or call changes
    if (!open || !call) {
      setCurrentPlaybackTime(0)
    }
  }, [open, call?.call_id])

  // Reset auto-scroll state EVERY time drawer opens (regardless of same call or different call)
  React.useEffect(() => {
    if (open) {
      // Mark as programmatic change to prevent tab change detection from disabling auto-scroll
      programmaticScrollRef.current = true
      
      // Enable auto-scroll when drawer opens - ALWAYS reset for fresh experience
      setAutoScrollDisabled(false)
      setUserIsScrolling(false)
      // Reset audio duration to ensure fresh start
      setActualAudioDuration(0)
      // Reset to initial tab (don't override initialTab)
      setActiveTab(initialTab)
      
      // Reset programmatic scroll flag after state changes complete
      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 100)
    }
  }, [open, initialTab]) // Depend on 'open' and 'initialTab' to ensure correct tab is set

  // Additional cleanup when drawer closes
  React.useEffect(() => {
    if (!open) {
      // Reset all state when drawer closes to ensure fresh start next time
      setAutoScrollDisabled(false)
      setUserIsScrolling(false)
      setActiveTab('highlights')
      programmaticScrollRef.current = false
    }
  }, [open])

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (seconds: number) => {
    // Round to avoid floating point precision issues
    const totalSeconds = Math.round(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Resolve and memoize the audio URL
  const resolvedAudioUrl = React.useMemo(() => {
    return reportData?.recordingUrl || ''
  }, [reportData?.recordingUrl])

  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('')
  const [triedRawFallback, setTriedRawFallback] = useState(false)

  React.useEffect(() => {
    // Reset when call changes
    setActiveAudioUrl(resolvedAudioUrl)
    setTriedRawFallback(false)
  }, [resolvedAudioUrl, call?.call_id])
  
  // Auto-scroll to current transcript entry during playback
  React.useEffect(() => {
    if (!isPlaying || !normalizedTranscript.length || autoScrollDisabled || userIsScrolling) {
      return
    }

    if (!currentTranscriptEntryRef.current) {
      return
    }

    // Add a small delay to ensure DOM has updated with the new ref assignment
    const scrollTimeout = setTimeout(() => {
      if (!currentTranscriptEntryRef.current) return

      // Check if the current entry is in the viewport
      const container = scrollContainerRef.current
      if (!container) return

      const entryElement = currentTranscriptEntryRef.current
      const containerRect = container.getBoundingClientRect()
      const entryRect = entryElement.getBoundingClientRect()

      // Calculate if the entry is out of view (with some padding)
      const isOutOfView = (
        entryRect.top < containerRect.top + 100 || // Above viewport (with 100px padding)
        entryRect.bottom > containerRect.bottom - 100 // Below viewport (with 100px padding)
      )

      if (isOutOfView) {
        // Mark as programmatic scroll to avoid triggering user scroll detection
        programmaticScrollRef.current = true
        // Scroll the entry into view with smooth behavior
        entryElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center', // Center the entry in the viewport
          inline: 'nearest' 
        })
        // Reset programmatic scroll flag after scroll completes
        setTimeout(() => {
          programmaticScrollRef.current = false
        }, 1000)
      }
    }, 100) // Small delay to ensure ref assignment has completed

    return () => clearTimeout(scrollTimeout)
  }, [currentPlaybackTime, isPlaying, activeTab, normalizedTranscript, autoScrollDisabled, userIsScrolling])

  // Clean up user scroll timeout when drawer closes
  React.useEffect(() => {
    if (!open) {
      setUserIsScrolling(false)
      setShowJumpButton(false)
      setIsActiveTranscriptInView(true)
      lastVisibilityStateRef.current = true
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
        userScrollTimeoutRef.current = null
      }
      if (visibilityCheckTimeoutRef.current) {
        clearTimeout(visibilityCheckTimeoutRef.current)
        visibilityCheckTimeoutRef.current = null
      }
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current)
        scrollThrottleRef.current = null
      }
      if (jumpButtonDebounceRef.current) {
        clearTimeout(jumpButtonDebounceRef.current)
        jumpButtonDebounceRef.current = null
      }
    }
  }, [open])
  
  // Hide jump button when audio stops playing
  React.useEffect(() => {
    if (!isPlaying) {
      setShowJumpButton(false)
      setIsActiveTranscriptInView(true)
      lastVisibilityStateRef.current = true
      // Clear any pending visibility checks
      if (visibilityCheckTimeoutRef.current) {
        clearTimeout(visibilityCheckTimeoutRef.current)
        visibilityCheckTimeoutRef.current = null
      }
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current)
        scrollThrottleRef.current = null
      }
      if (jumpButtonDebounceRef.current) {
        clearTimeout(jumpButtonDebounceRef.current)
        jumpButtonDebounceRef.current = null
      }
    }
  }, [isPlaying])

  // Monitor active transcript visibility only when transcript entry ref changes
  React.useEffect(() => {
    if (!isPlaying || !normalizedTranscript.length || !currentTranscriptEntryRef.current) {
      return
    }

    // Only check visibility when the active transcript entry actually changes
    // This reduces frequent checks that cause flickering
    checkActiveTranscriptVisibility()
  }, [currentTranscriptEntryRef.current]) // Remove checkActiveTranscriptVisibility from deps to prevent loops

  // Update jump button visibility based on active transcript visibility (with stable debouncing)
  React.useEffect(() => {
    const shouldShow = isPlaying && normalizedTranscript.length > 0 && userIsScrolling && !isActiveTranscriptInView
    
    // Clear any existing debounce timeout
    if (jumpButtonDebounceRef.current) {
      clearTimeout(jumpButtonDebounceRef.current)
    }
    
    // Use longer debounce and only update if state actually changes
    jumpButtonDebounceRef.current = setTimeout(() => {
      setShowJumpButton(prev => {
        // Only update if the state actually needs to change
        if (prev !== shouldShow) {
          return shouldShow
        }
        return prev
      })
    }, 300) // Increased debounce time to prevent rapid state changes
    
  }, [isActiveTranscriptInView, isPlaying, normalizedTranscript.length, userIsScrolling])
  
  // Auto-start playback when triggered from table view
  React.useEffect(() => {
    if (autoStartPlayback && call && open) {
      // Switch to transcript tab first
      setActiveTab('transcript')
      setAutoScrollDisabled(false)
      
      // Start playing after a short delay to ensure tab is switched
      const startPlayback = () => {
        const tryPlay = (attempt = 1) => {
          if (drawerAudioPlayerRef.current && drawerAudioPlayerRef.current.play) {
            try {
              drawerAudioPlayerRef.current.play()
              // Inform parent that drawer started playing
              if (call && typeof onPlayStateChange === 'function') onPlayStateChange(call, true)
            } catch (error) {
              // Audio play attempt failed
              if (attempt < 3) {
                // Retry up to 3 times with increasing delay
                setTimeout(() => tryPlay(attempt + 1), attempt * 200)
              }
            }
          } else if (attempt < 3) {
            // Audio player not ready, retry
            setTimeout(() => tryPlay(attempt + 1), attempt * 200)
          }
        }
        
        tryPlay()
        
        // Scroll to transcript section
        if (transcriptSectionRef.current) {
          transcriptSectionRef.current.scrollIntoView({ behavior: 'smooth' })
        }

        // After starting playback, center the active transcript entry
        setTimeout(() => {
          try {
            // Mark programmatic to avoid disabling auto-scroll
            programmaticScrollRef.current = true
            // Use current playback time if available, otherwise nudge to the first timestamp
            const targetTime = (typeof currentPlaybackTime === 'number' && currentPlaybackTime > 0) ? currentPlaybackTime : 0.1
            scrollToTranscriptAtTime(targetTime)
          } finally {
            setTimeout(() => {
              programmaticScrollRef.current = false
            }, 800)
          }
        }, 400)
        
        // Mark auto-start as complete
        if (onAutoStartComplete) {
          onAutoStartComplete()
        }
      }

      // If transcript is already loaded, start immediately
      if (normalizedTranscript.length > 0) {
        setTimeout(startPlayback, 300)
      } else {
        // If transcript is not loaded yet, wait for it with a timeout
        const maxWaitTime = 2000 // 2 seconds max wait
        const checkInterval = 100 // Check every 100ms
        let elapsed = 0
        
        const checkTranscript = () => {
          if (normalizedTranscript.length > 0) {
            setTimeout(startPlayback, 300)
          } else if (elapsed < maxWaitTime) {
            elapsed += checkInterval
            setTimeout(checkTranscript, checkInterval)
          } else {
            // Timeout reached, try to start anyway
            setTimeout(startPlayback, 300)
          }
        }
        
        checkTranscript()
      }
    }
  }, [autoStartPlayback, autoStartKey, call, open, normalizedTranscript.length, onPlayStateChange, onAutoStartComplete])

  useEffect(()=>{
    if (autoScrollTo) {
      scrollToSection(summarySectionRef, autoScrollTo)
    }
  }, [autoScrollTo])

  // Helper functions
  const getCustomerDisplayName = (call: CallRecord) => {
    return call.customer.name || 'Unknown Customer'
  }

  const getCustomerDisplayPhone = (call: CallRecord) => {
    return call.customer.phone || 'No phone number'
  }

  const getCustomerInitials = (call: CallRecord) => {
    const name = getCustomerDisplayName(call)
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const getTimeAgo = (call: CallRecord) => {
    // For CallRecord, we need to format the started_at timestamp
    const date = new Date(call.started_at)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCallTitle = (call: CallRecord) => {
    return `Call with ${getCustomerDisplayName(call)}`
  }

  const getTopHighlights = React.useMemo(() => {
    if (!reportData) return { highlights: [], totalCount: 0 }
    
    const highlights: string[] = []
    
    // Use analysis highlights if available
    if (reportData.analysis?.highlights && reportData.analysis.highlights.length > 0) {
      highlights.push(...reportData.analysis.highlights)
    } else if (reportData.summary) {
      // Fallback to summary
      highlights.push(reportData.summary)
    }
    
    // Fallback highlights if no real data
    if (highlights.length === 0) {
      return { highlights: ['No key highlights available for this call'], totalCount: 0 }
    }
    
    const totalCount = highlights.length
    
    return { 
      highlights, 
      totalCount 
    }
  }, [reportData])

  // Early return if no call data
  if (!call) {
    return null
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: '#fafbfc' }}>
      {/* Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain" style={{ backgroundColor: '#fafbfc' }}>
        {/* Sticky Header + Recording + Tabs */}
        <div className="sticky top-0 z-30 backdrop-blur bg-white">
          <div className="px-6 py-4 border-b border-black/10">
            {/* Call Header + Close Button inline */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#00bc7c' }}>
                <span className="text-base font-bold text-white">
                  {getCustomerInitials(call)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[17px] font-semibold leading-tight" style={{ color: 'rgba(0,0,0,0.8)' }}>
                  {getCustomerDisplayName(call)}
                </h1>
                <p className="text-[13px] mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  Last Interacted at {getTimeAgo(call)}
                </p>
              </div>
              {detailsLoading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={onClose}
                className="hover:bg-black/5 p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex-shrink-0"
                style={{ color: 'rgba(0,0,0,0.4)', transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' }}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Error State */}
            {detailsError && (
              <div className="flex items-center gap-2 text-red-700 mb-4 bg-red-50 rounded-lg p-3 border border-red-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Error loading details: {detailsError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retry}
                  className="ml-2 h-7 px-3 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* ── Record Details ── */}
          <div className="px-6 pt-4 pb-3 border-b border-black/10">
            <div className="flex items-center gap-1.5 mb-3">
              <Star className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.4)' }} />
              <span className="text-[13px] font-semibold" style={{ color: 'rgba(0,0,0,0.6)' }}>Record Details</span>
            </div>

            {/* Cards — fill full width equally */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Phone */}
              <div className="rounded-[12px] p-3 flex flex-col gap-2" style={{ backgroundColor: '#f7f7f7' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>Phone</span>
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.3)' }} />
                </div>
                <p className="text-[13px] font-semibold truncate" style={{ color: 'rgba(0,0,0,0.8)' }}>
                  {reportData?.customerInfo?.phone || getCustomerDisplayPhone(call) || 'Not Available'}
                </p>
              </div>

              {/* Email */}
              <div className="rounded-[12px] p-3 flex flex-col gap-2" style={{ backgroundColor: '#f7f7f7' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>Email</span>
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.3)' }} />
                </div>
                <p className="text-[13px] font-semibold truncate" style={{ color: 'rgba(0,0,0,0.8)' }}>
                  {reportData?.customerInfo?.email || call.customer.email || 'Not Available'}
                </p>
              </div>

              {/* Created On */}
              <div className="rounded-[12px] p-3 flex flex-col gap-2" style={{ backgroundColor: '#f7f7f7' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>Created on</span>
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(0,0,0,0.3)' }} />
                </div>
                <p className="text-[13px] font-semibold truncate" style={{ color: 'rgba(0,0,0,0.8)' }}>
                  {new Date(call.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

          </div>

      {/* Recording Section */}
      {reportData?.recordingUrl && (
        <div className="bg-white">
          <div className="px-6 py-2">
            <div className="space-y-3">
              
              {/* Jump to Current Position Button - Shows when scrolling during playback */}
              {showJumpButton && (
                <div className="flex justify-center mb-3">
                  <Button
                    onClick={handleJumpToCurrentPosition}
                    className="h-8 px-3 text-xs bg-[#4600f2] hover:bg-[#3800c2] text-white border-0 rounded-full shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2 hover:scale-105 active:scale-95 ripple-effect"
                    style={{ transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' }}
                  >
                    <ArrowDown className="h-3 w-3 mr-1" />
                    Jump to current position
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                {/* Player Controls */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 flex-shrink-0 ripple-effect"
                  style={{
                    backgroundColor: '#4600f2',
                    borderColor: '#4600f2',
                    color: 'white',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)'
                  }}
                  disabled={!resolvedAudioUrl}
                  title={!resolvedAudioUrl ? 'No recording available for this call' : (isPlaying ? 'Pause' : 'Play')}
                  onClick={(e) => {
                    e.stopPropagation()
                    
                    // Always switch to transcript tab when button is clicked (if transcript available)
                    if (normalizedTranscript.length > 0 && activeTab !== 'transcript') {
                      // Mark as programmatic scroll to avoid disabling auto-scroll
                      programmaticScrollRef.current = true
                      setActiveTab('transcript')
                      // Re-enable auto-scroll when switching to transcript
                      setAutoScrollDisabled(false)
                      // Scroll to transcript section and focus the active entry
                      setTimeout(() => {
                        if (transcriptSectionRef.current) {
                          transcriptSectionRef.current.scrollIntoView({ behavior: 'smooth' })
                        }
                        // After the section is in view, scroll to the current transcript entry
                        setTimeout(() => {
                          const targetTime = (typeof currentPlaybackTime === 'number' && currentPlaybackTime > 0) ? currentPlaybackTime : 0.1
                          scrollToTranscriptAtTime(targetTime)
                          // Reset programmatic scroll flag after scroll completes
                          setTimeout(() => {
                            programmaticScrollRef.current = false
                          }, 600)
                        }, 300)
                      }, 100)
                    }
                    
                    if (!resolvedAudioUrl) {
                      // No audio URL available for call
                      return
                    }
                    if (isPlaying) {
                      // Pause audio
                      if (drawerAudioPlayerRef.current && drawerAudioPlayerRef.current.pause) {
                        drawerAudioPlayerRef.current.pause()
                      }
                    } else {
                      // Play audio
                      if (drawerAudioPlayerRef.current && drawerAudioPlayerRef.current.play) {
                        drawerAudioPlayerRef.current.play()
                      }
                    }
                  }}
                >
                  {isPlaying ? (
                    <Pause className="h-2.5 w-2.5 text-white fill-white" />
                  ) : (
                    <Play className="h-2.5 w-2.5 text-white fill-white" />
                  )}
                </Button>
                
                <div className="text-sm text-gray-600 flex-shrink-0">
                  {formatDuration(currentPlaybackTime)} / {formatDuration(actualAudioDuration || reportData?.duration || 0)}
                </div>
                
                {/* Waveform with Progress Line */}
                <div className="relative flex-1 min-w-0 overflow-hidden">
                  <div 
                    className="flex items-center gap-px h-8 cursor-pointer hover:opacity-80 transition-opacity relative w-full"
                    title="Click anywhere to jump to that time"
                    onClick={(e) => {
                      if (!drawerAudioPlayerRef.current) return
                      
                      const rect = e.currentTarget.getBoundingClientRect()
                      const clickX = e.clientX - rect.left
                      const clickPercentage = clickX / rect.width
                      const newTime = Math.floor(clickPercentage * (actualAudioDuration || reportData?.duration || 0))
                      
                      // Seek to the clicked position
                      if (drawerAudioPlayerRef.current.seek) {
                        drawerAudioPlayerRef.current.seek(newTime)
                        setCurrentPlaybackTime(newTime)
                        
                        // Visual feedback - briefly highlight the clicked area
                        const clickedBar = e.currentTarget.children[Math.floor(clickPercentage * 100)] as HTMLElement
                        if (clickedBar) {
                          const originalBg = clickedBar.style.backgroundColor
                          clickedBar.style.backgroundColor = '#8b5cf6' // Purple highlight
                          setTimeout(() => {
                            clickedBar.style.backgroundColor = originalBg
                          }, 200)
                        }
                        
                        // Enable auto-scroll and switch to transcript tab for better UX
                        if (normalizedTranscript.length > 0) {
                          setAutoScrollDisabled(false)
                          
                          // If not already on transcript tab, switch to it
                          if (activeTab !== 'transcript') {
                            programmaticScrollRef.current = true
                            setActiveTab('transcript')
                            
                            // Scroll to transcript section first
                            setTimeout(() => {
                              if (transcriptSectionRef.current) {
                                transcriptSectionRef.current.scrollIntoView({ behavior: 'smooth' })
                              }
                              
                              // Then find and scroll to the specific transcript entry
                              setTimeout(() => {
                                scrollToTranscriptAtTime(newTime)
                                programmaticScrollRef.current = false
                              }, 500)
                            }, 100)
                          } else {
                            // Already on transcript tab, just scroll to the entry
                            setTimeout(() => {
                              scrollToTranscriptAtTime(newTime)
                            }, 100)
                          }
                        }
                      }
                    }}
                    onMouseMove={(e) => {
                      // Show preview of where clicking would seek to
                      const rect = e.currentTarget.getBoundingClientRect()
                      const mouseX = e.clientX - rect.left
                      const mousePercentage = mouseX / rect.width
                      const previewTime = Math.floor(mousePercentage * (actualAudioDuration || reportData?.duration || 0))
                      
                      // Update the title to show the preview time
                      e.currentTarget.title = `Click to jump to ${formatDuration(previewTime)}`
                    }}
                  >
                    {Array.from({ length: 100 }, (_, i) => (
                      <div
                        key={i}
                        className={`transition-all duration-300 ${
                          i <= (currentPlaybackTime / (actualAudioDuration || reportData?.duration || 1) * 100) ? 'bg-[#4600f2]' : 'bg-gray-300'
                        }`}
                        style={{
                          height: `${Math.random() * 80 + 20}%`,
                          borderRadius: '1px',
                          width: '1%',
                          minWidth: '1px'
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Audio Player for actual audio playback */}
                {reportData?.recordingUrl && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1">
                      <AudioPlayer 
                        key={`drawer-audio-${call.call_id}`}
                        ref={drawerAudioPlayerRef}
                        audioUrl={activeAudioUrl || resolvedAudioUrl}
                        showWaveform={true}
                        autoPlay={false}
                        hideControls={true}
                        onTimeUpdate={(time: number) => {
                          setCurrentPlaybackTime(time)
                        }}
                        onDurationChange={(duration: number) => {
                          setActualAudioDuration(duration)
                        }}
                        onEnded={() => {
                          try {
                            if (typeof onPlayStateChange === 'function') onPlayStateChange(call, false)
                          } catch {}
                        }}
                        onError={(msg: string) => {
                          // Audio playback error
                        }}
                        onPlay={() => {
                          if (call && typeof onPlayStateChange === 'function') onPlayStateChange(call, true)
                        }}
                        onPause={() => {
                          if (call && typeof onPlayStateChange === 'function') onPlayStateChange(call, false)
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRestartAudio}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Restart from beginning"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadAudio}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Download audio"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-100 bg-white">
        <div className="px-6">
          <nav className="flex space-x-3 overflow-x-auto">
            <button
              onClick={() => scrollToSection(highlightsSectionRef, 'highlights')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative hover:bg-gray-50 active:bg-gray-100 ${
                activeTab === 'highlights'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Highlights
              {activeTab === 'highlights' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full" />
              )}
            </button>
            <button
              onClick={() => scrollToSection(summarySectionRef, 'summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative hover:bg-gray-50 active:bg-gray-100 ${
                activeTab === 'summary'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summary
              {activeTab === 'summary' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full" />
              )}
            </button>

            <button
              onClick={() => scrollToSection(appointmentSectionRef, 'appointment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative hover:bg-gray-50 active:bg-gray-100 ${
                activeTab === 'appointment'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointment
              {activeTab === 'appointment' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full" />
              )}
            </button>
            {call?.smsThread && call.smsThread.length > 0 && (
              <button
                onClick={() => scrollToSection(smsSectionRef, 'sms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative hover:bg-gray-50 active:bg-gray-100 ${
                  activeTab === 'sms'
                    ? 'border-[#4600f2] text-[#4600f2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Conversation
                {activeTab === 'sms' && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full" />
                )}
              </button>
            )}
            {!hideTranscript && (
              <button
                onClick={() => scrollToSection(transcriptSectionRef, 'transcript')}
                disabled={normalizedTranscript.length === 0}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative ${
                  activeTab === 'transcript'
                    ? 'border-[#4600f2] text-[#4600f2]'
                    : normalizedTranscript.length === 0
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                }`}
                title={normalizedTranscript.length === 0 ? 'No transcript available' : 'View transcript'}
              >
                Transcript
                {activeTab === 'transcript' && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full" />
                )}
              </button>
            )}
          </nav>
        </div>
      </div>
        </div>

      {/* Content Area */}
      <div className="flex-none" style={{ backgroundColor: '#fafbfc' }}>
        <div className="px-6 py-6">

          {detailsLoading ? (
            <RightPanelShimmer />
          ) : (
            <div className="divide-y divide-black/[0.06] [&>*]:py-6 first:[&>*]:pt-0 last:[&>*]:pb-0">
              {/* Key Highlights */}
              <div ref={highlightsSectionRef} className="space-y-3">
                <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(0,0,0,0.8)' }}>
                  <AlertCircle className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
                  Key Highlights
                </h3>

                <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
                  {getTopHighlights.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3 px-4 py-3 border-b border-black/10 last:border-b-0">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full border border-black/10 flex items-center justify-center text-[10px] font-semibold mt-0.5"
                        style={{ backgroundColor: '#fafbfc', color: 'rgba(0,0,0,0.5)' }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-[13px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.7)' }}>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call Summary */}
              <div ref={summarySectionRef} className="space-y-3">
                <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(0,0,0,0.8)' }}>
                  <FileText className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
                  Summary & Action Items
                </h3>

                <div className="space-y-3">
                  <div className="rounded-xl border border-[#f59e0b] bg-white overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-[#f59e0b]/30" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.08) 0%, rgba(255,255,255,0) 100%)' }}>
                      <span className="text-[11px] font-semibold tracking-wide" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        CALL SUMMARY
                      </span>
                    </div>
                    <div className="px-4 py-3 text-[13px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.75)' }}>
                      {reportData?.summary || 'No summary available'}
                    </div>
                  </div>

                  {(reportData?.actionItems && reportData.actionItems.length > 0) || (reportData?.analysis?.nextActions && reportData.analysis.nextActions.length > 0) ? (
                    <div className="rounded-xl bg-white border border-black/10 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-black/10" style={{ background: 'linear-gradient(90deg, rgba(79,0,253,0.06) 0%, rgba(255,255,255,0) 100%)' }}>
                        <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#4f00fd' }}>NEXT ACTION REQUIRED</span>
                      </div>
                      <div className="px-4 py-3">
                        <ul className="space-y-1.5">
                          {(reportData?.actionItems || reportData?.analysis?.nextActions || []).map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-[13px]" style={{ color: 'rgba(0,0,0,0.75)' }}>
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#4f00fd' }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white border border-black/10 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-black/10">
                        <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'rgba(0,0,0,0.4)' }}>NEXT ACTION REQUIRED</span>
                      </div>
                      <div className="px-4 py-3 text-[13px]" style={{ color: 'rgba(0,0,0,0.45)' }}>
                        No specific action items identified
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Performance Analysis */}
              {reportData?.aiScore && (
                <div className="space-y-3">
                  <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(0,0,0,0.8)' }}>
                    <Bot className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
                    AI Performance Analysis
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-black/10 p-4">
                      <div className="text-[11px] font-medium mb-1.5" style={{ color: 'rgba(0,0,0,0.4)' }}>Overall Score</div>
                      <div className={`text-xl font-bold ${
                        reportData.aiScore >= 8 ? 'text-green-600' :
                        reportData.aiScore >= 6 ? 'text-yellow-600' :
                        'text-red-500'
                      }`}>
                        {reportData.aiScore.toFixed(1)}<span className="text-sm font-normal ml-0.5 opacity-60">/10</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-black/10 p-4">
                      <div className="text-[11px] font-medium mb-1.5" style={{ color: 'rgba(0,0,0,0.4)' }}>Customer Satisfaction</div>
                      <div className={`text-xl font-bold ${
                        (() => {
                          const score = reportData.analysis?.customerSatisfaction || reportData.sentiment?.score || 0;
                          const n = score <= 1 ? score : score / 10;
                          return n >= 0.8 ? 'text-green-600' : n >= 0.6 ? 'text-yellow-600' : 'text-red-500';
                        })()
                      }`}>
                        {(() => {
                          const score = reportData.analysis?.customerSatisfaction || reportData.sentiment?.score || 0;
                          const displayScore = score <= 1 ? score * 10 : score;
                          return displayScore.toFixed(1);
                        })()}<span className="text-sm font-normal ml-0.5 opacity-60">/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              <div ref={appointmentSectionRef} className="space-y-3">
                <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(0,0,0,0.8)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
                  Appointment
                </h3>

                <div className="bg-white rounded-xl border border-black/10 p-4">
                  <div className="flex items-stretch divide-x divide-black/10">
                    <div className="flex-1 pr-4">
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Type</div>
                      <div className="text-[13px] font-semibold capitalize" style={{ color: 'rgba(0,0,0,0.8)' }}>
                        {reportData?.appointmentDetails?.type ? reportData.appointmentDetails.type.replace(/_/g, ' ') : 'Not specified'}
                      </div>
                    </div>
                    <div className="flex-1 px-4">
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Status</div>
                      <div className="text-[13px] font-semibold capitalize" style={{ color: 'rgba(0,0,0,0.8)' }}>
                        {reportData?.appointmentDetails?.status || 'No status'}
                      </div>
                    </div>
                    <div className="flex-1 pl-4">
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Date & Time</div>
                      <div className="text-[13px] font-semibold" style={{ color: 'rgba(0,0,0,0.8)' }}>
                        {reportData?.appointmentDetails?.scheduledAt ? formatDateTime(reportData.appointmentDetails.scheduledAt) : 'Not scheduled'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Section */}
              {call?.smsThread && call.smsThread.length > 0 && (
                <div ref={smsSectionRef} className="space-y-3">
                  <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(0,0,0,0.8)' }}>
                    <MessageSquare className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.3)' }} />
                    Conversation
                  </h3>

                  <div className="bg-white rounded-xl border border-black/10 px-4 pt-6 pb-4 flex flex-col gap-6">

                    {/* Beginning label */}
                    <div className="text-center">
                      <p className="text-[12px] text-[#8f8f8f]">This is the beginning of your text conversation</p>
                    </div>

                    {call.smsThread.map((msg, i) => {
                      const prev = i > 0 ? call.smsThread![i - 1] : undefined
                      const showDay = msg.day !== undefined && msg.day !== prev?.day
                      const isAgent = msg.sender === 'agent'

                      return (
                        <div key={i} className="flex flex-col gap-5">

                          {/* EOD chip — shown before the day label */}
                          {msg.preBanner && msg.preBanner.variant === 'eod' && (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex-1 h-px bg-[#e5e7eb]" />
                                <div className="flex items-center px-3 py-1 rounded-[12px] shrink-0" style={{ backgroundColor: '#fee9f5' }}>
                                  <span className="text-[12px] text-[#c12588]">
                                    <span className="font-semibold">EOD</span>
                                    <span className="font-medium">{msg.preBanner.text.replace(/^EOD/, '')}</span>
                                  </span>
                                </div>
                                <div className="flex-1 h-px bg-[#e5e7eb]" />
                              </div>
                              {/* Day label after EOD */}
                              {showDay && (
                                <p className="text-[12px] font-medium text-center" style={{ color: 'rgba(10,10,10,0.6)' }}>
                                  {msg.dateLabel ? `${msg.dateLabel} (Day ${msg.day})` : `Day ${msg.day}`}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Escalation chip */}
                          {msg.preBanner && msg.preBanner.variant === 'escalation' && (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex-1 h-px bg-[#e5e7eb]" />
                                <div className="flex items-center px-3 py-1 rounded-[36px] shrink-0" style={{ backgroundColor: '#f3ebff' }}>
                                  <span className="text-[12px] font-semibold text-[#6941c6] whitespace-nowrap">{msg.preBanner.text}</span>
                                </div>
                                <div className="flex-1 h-px bg-[#e5e7eb]" />
                              </div>
                              {/* Day label after escalation */}
                              {showDay && (
                                <p className="text-[12px] font-medium text-center" style={{ color: 'rgba(10,10,10,0.6)' }}>
                                  {msg.dateLabel ? `${msg.dateLabel} (Day ${msg.day})` : `Day ${msg.day}`}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Call attempted chip */}
                          {msg.preBanner && msg.preBanner.variant === 'callAttempted' && (
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-px bg-[#e5e7eb]" />
                              <div className="flex items-center px-3 py-1 rounded-[36px] shrink-0" style={{ backgroundColor: '#fff3e0' }}>
                                <span className="text-[12px] font-semibold text-[#c2420d] whitespace-nowrap">{msg.preBanner.text}</span>
                              </div>
                              <div className="flex-1 h-px bg-[#e5e7eb]" />
                            </div>
                          )}

                          {/* Day label when no pre-banner */}
                          {showDay && !msg.preBanner && (
                            <p className="text-[12px] font-medium text-center" style={{ color: 'rgba(10,10,10,0.6)' }}>
                              {msg.dateLabel ? `${msg.dateLabel} (Day ${msg.day})` : `Day ${msg.day}`}
                            </p>
                          )}

                          {/* Agent message bubble (right-aligned) */}
                          {isAgent && !msg.standaloneCall && (
                            <div className="flex items-start justify-end gap-3">
                              <div className="flex flex-col gap-1 items-start">
                                <div className="px-3 py-2 rounded-[8px] max-w-[269px]" style={{ backgroundColor: 'rgba(0,52,220,0.1)' }}>
                                  <p className="text-[12px] font-medium leading-5" style={{ color: 'rgba(10,10,10,0.8)' }}>{msg.text}</p>
                                </div>
                                <div className="flex items-center gap-3 justify-end w-full">
                                  <span className="text-[10px] font-medium text-[#3658c7]">SpyneAI</span>
                                  <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.4)' }}>{msg.timestamp}</span>
                                </div>
                              </div>
                              {/* Agent avatar square */}
                              <div className="w-9 h-9 rounded-[6px] bg-[#3658c7] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                <span className="text-[11px] font-bold text-white">AI</span>
                              </div>
                            </div>
                          )}

                          {/* Voicemail card */}
                          {msg.voicemail && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] border" style={{ backgroundColor: 'rgba(255,247,243,0.8)', borderColor: 'rgba(254,222,199,0.5)' }}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f97315]">
                                <Phone className="h-3.5 w-3.5 text-white" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px] font-medium text-[#c2420d] leading-tight">Voicemail Left</span>
                                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(0,0,0,0.5)' }}>{msg.voicemail.startedAt} · {msg.voicemail.duration}</span>
                                </div>
                                <p className="text-[11px] leading-tight" style={{ color: 'rgba(10,10,10,0.6)' }}>
                                  {msg.voicemail.description || "Customer didn't answer; an automated voicemail was left."}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Standalone call card */}
                          {msg.standaloneCall && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] border" style={{ backgroundColor: 'rgba(244,243,255,0.8)', borderColor: 'rgba(199,210,254,0.5)' }}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#3658c7]">
                                <PhoneCall className="h-3.5 w-3.5 text-white" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px] font-medium text-[#3658c7] leading-tight">Standalone Call</span>
                                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(0,0,0,0.5)' }}>{msg.standaloneCall.startedAt} · {msg.standaloneCall.duration}</span>
                                </div>
                                <p className="text-[11px] leading-tight" style={{ color: 'rgba(10,10,10,0.6)' }}>
                                  {msg.standaloneCall.description || 'Call completed'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Post-call standalone card */}
                          {msg.postCall && <StandaloneCallCard postCall={msg.postCall} />}

                          {/* Customer message bubble (left-aligned) */}
                          {!isAgent && !msg.voicemail && !msg.standaloneCall && !msg.postCall && (
                            <div className="flex items-start gap-3">
                              {/* Customer avatar */}
                              <div className="w-10 h-10 rounded-[7.5px] flex-shrink-0 flex items-center justify-center text-[14px] font-semibold text-white" style={{ backgroundColor: '#3658c7' }}>
                                {getCustomerInitials(call)}
                              </div>
                              <div className="flex flex-col gap-1 items-start">
                                <div className="px-3 py-2 rounded-[8px] border border-[#f0f0f0]" style={{ background: 'linear-gradient(90deg, rgba(216,216,216,0.2) 0%, rgba(216,216,216,0.2) 100%), #fff' }}>
                                  <p className="text-[12px] font-normal leading-5 text-[#0a0a0a]">{msg.text}</p>
                                </div>
                                <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.4)' }}>{msg.timestamp}</span>
                              </div>
                            </div>
                          )}

                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Transcript Section — only when not hidden and data exists */}
              {!hideTranscript && normalizedTranscript.length > 0 && (
                <div ref={transcriptSectionRef} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-700/30" />
                    Transcript
                    {detailsLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-600 ml-2" />}
                  </h3>

                  {/* Transcript Cards */}
                  <div className="space-y-4">
                    {normalizedTranscript.map((entry, index) => {
                      const isCurrentlyPlaying = isPlaying &&
                        entry.timestamp &&
                        currentPlaybackTime >= entry.timestamp &&
                        (index === normalizedTranscript.length - 1 || !normalizedTranscript[index + 1]?.timestamp || currentPlaybackTime < (normalizedTranscript[index + 1]?.timestamp || 0))

                      return (
                        <div
                          key={index}
                          ref={isCurrentlyPlaying ? currentTranscriptEntryRef : null}
                          data-transcript-entry={index}
                          className={`border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md focus:outline-none active:bg-gray-50 focus:bg-gray-50 ${
                            isCurrentlyPlaying
                              ? 'shadow-md'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          style={{
                            backgroundColor: isCurrentlyPlaying ? 'rgba(70, 0, 242, 0.1)' : undefined,
                            borderColor: isCurrentlyPlaying ? '#4600f2' : undefined
                          }}
                          onClick={(e) => {
                            e.stopPropagation()

                            if (entry.timestamp && drawerAudioPlayerRef.current) {
                              if (drawerAudioPlayerRef.current.seek) {
                                drawerAudioPlayerRef.current.seek(entry.timestamp)
                                setCurrentPlaybackTime(entry.timestamp)

                                setTimeout(() => {
                                  if (drawerAudioPlayerRef.current && drawerAudioPlayerRef.current.play) {
                                    try {
                                      drawerAudioPlayerRef.current.play()
                                    } catch (error) {
                                      // Error starting audio playback
                                    }
                                  }
                                }, 100)
                              }
                            }
                          }}
                          title={entry.timestamp ? `Click to play from ${Math.floor(entry.timestamp / 60)}:${(entry.timestamp % 60).toString().padStart(2, '0')}` : "No timestamp available"}
                        >
                          <div className="p-4">
                            <div className="flex gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                                isCurrentlyPlaying
                                  ? 'bg-[#4600f2] text-white'
                                  : (entry.speaker.toLowerCase().includes('agent') || entry.speaker.toLowerCase().includes('bot') || entry.speaker.toLowerCase().includes('assistant')
                                      ? 'bg-purple-200 text-purple-700' : 'bg-green-200 text-green-700')
                              }`}>
                                {entry.speaker.toLowerCase().includes('agent') || entry.speaker.toLowerCase().includes('bot') || entry.speaker.toLowerCase().includes('assistant')
                                  ? (call.agentInfo?.agentName || call.agentConfig?.agentName || 'AG').slice(0, 2).toUpperCase()
                                  : getCustomerInitials(call)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-3 mb-2">
                                  <span className={`font-semibold ${isCurrentlyPlaying ? 'text-[#4600f2]' : 'text-gray-900'}`}>
                                    {entry.speaker.toLowerCase().includes('agent') || entry.speaker.toLowerCase().includes('bot') || entry.speaker.toLowerCase().includes('assistant') ? 'Agent' : entry.speaker}
                                  </span>
                                  {entry.timestamp && (
                                    <span className={`text-xs ${isCurrentlyPlaying ? 'text-[#4600f2]/80' : 'text-gray-500'}`}>
                                      {Math.floor(entry.timestamp / 60)}:{Math.floor(entry.timestamp % 60).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                                <div className={`leading-relaxed ${isCurrentlyPlaying ? 'text-[#4600f2] font-medium' : 'text-gray-700'}`}>
                                  {entry.text}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
      </div>

      {/* Sticky Footer — View Full Conversation */}
      {call?.smsThread && call.smsThread.length > 0 && (
        <div className="px-4 py-4 border-t border-white/20 flex-shrink-0" style={{ backgroundColor: '#fafbfc' }}>
          <Button
            className="w-full text-sm font-semibold text-white rounded-xl h-11"
            style={{ backgroundColor: '#4600f2', border: 'none' }}
          >
            View Full Conversation
          </Button>
        </div>
      )}
    </div>
  )
}
