import React, { useState, useRef } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Play, Pause, Calendar, Car, User, Phone, Clock, ChevronDown, ChevronRight, Edit, X, Bot, AlertCircle, Wrench, Mail, FileText, Tag, MapPin, Loader2 } from "lucide-react"
import AudioPlayer from "@/components/ui/audio-player"
import type { CallRecord } from "@/types/call-record"
import { getCustomerDisplayName, getCustomerDisplayPhone, getCustomerInitials } from "@/lib/utils"
import { useCallDetails } from "@/hooks/use-call-details"
import { RightPanelShimmer } from "@/components/ui/right-panel-shimmer"


interface BlankCallDrawerProps {
  call: CallRecord | null
  open: boolean
  onClose: () => void
  onPlayStateChange?: (call: CallRecord, isPlaying: boolean) => void
  isPlaying: boolean
  audioRef: any // external ref from parent to control drawer audio
  autoStartPlayback?: boolean
  onAutoStartComplete?: () => void
  getAgentDetails: (callId: string) => { name: string; avatar: string }
  getCallSummary: (call: CallRecord) => string
  getVehicleInfo: (call: CallRecord) => string | null
  getNextAction: (call: CallRecord) => string
  getPotentialRevenue: (call: CallRecord) => number
  formatRevenue: (amount: number) => string
  getTimeAgo: (call: CallRecord) => string
  getCallTitle: (call: CallRecord) => string
}

export function BlankCallDrawer({ 
  call, 
  open, 
  onClose, 
  onPlayStateChange, 
  isPlaying, 
  audioRef,
  autoStartPlayback = false,
  onAutoStartComplete,
  getAgentDetails,
  getCallSummary,
  getVehicleInfo,
  getNextAction,
  getPotentialRevenue,
  formatRevenue,
  getTimeAgo,
  getCallTitle: getCallTitleProp
}: BlankCallDrawerProps) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'customer' | 'summary' | 'appointment' | 'transcript'>('highlights')
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [actualAudioDuration, setActualAudioDuration] = useState(0)
  const transcriptAnchorRef = useRef<HTMLDivElement | null>(null)
  
  // Refs for tracking currently playing transcript entry
  const currentTranscriptEntryRef = useRef<HTMLDivElement | null>(null)
  
  // State for managing auto-scroll behavior
  const [autoScrollDisabled, setAutoScrollDisabled] = useState(false)
  const lastActiveTabRef = useRef(activeTab)
  const programmaticScrollRef = useRef(false)
  
  // Fetch detailed call data when drawer opens - temporarily disabled for testing
  // const { callDetails, loading: detailsLoading, error: detailsError, retry } = useCallDetails(open && call ? call.call_id : null)
  const callDetails: any = null
  const detailsLoading = false
  const detailsError = null
  const retry = () => {}
  
  // Refs for scrolling to sections within Overview tab
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const highlightsSectionRef = useRef<HTMLDivElement | null>(null)
  const customerSectionRef = useRef<HTMLDivElement | null>(null)
  const summarySectionRef = useRef<HTMLDivElement | null>(null)

  const appointmentSectionRef = useRef<HTMLDivElement | null>(null)
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
  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement | null>, tabName: 'highlights' | 'customer' | 'summary' | 'appointment' | 'transcript') => {
    if (sectionRef.current) {
      // Disable auto-scroll when user manually navigates to a section
      setAutoScrollDisabled(true)
      
      // Mark as programmatic scroll to avoid triggering user scroll detection
      programmaticScrollRef.current = true
      setActiveTab(tabName)
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      // Reset programmatic scroll flag after scroll completes
      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 1000)
    }
  }

  // Function to scroll to a specific transcript entry based on timestamp
  const scrollToTranscriptAtTime = (targetTime: number) => {
    if (!normalizedTranscript.length || !scrollContainerRef.current) return

    // Find the transcript entry that corresponds to the target time
    let targetEntryIndex = normalizedTranscript.findIndex((entry: any, index: number) => {
      if (!entry.timestamp) return false

      const nextEntry = normalizedTranscript[index + 1]
      // Target entry is the one where:
      // 1. We're past its start time AND
      // 2. Either there's no next entry OR we haven't reached the next entry's start time
      return targetTime >= entry.timestamp && (!nextEntry || targetTime < nextEntry.timestamp)
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

    // Find the DOM element for this transcript entry
    const transcriptEntries = scrollContainerRef.current.querySelectorAll('[data-transcript-entry]')
    const targetElement = transcriptEntries[targetEntryIndex] as HTMLElement

    if (targetElement) {
      // Mark as programmatic scroll to avoid triggering user scroll detection
      programmaticScrollRef.current = true

      // Smoothly scroll container so the target element sits below the sticky header
      const container = scrollContainerRef.current
      const containerRect = container.getBoundingClientRect()
      const elRect = targetElement.getBoundingClientRect()
      const stickyOffset = 80 // approx height of sticky header
      const targetTop = (elRect.top - containerRect.top) + container.scrollTop - stickyOffset
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })

      // Reset programmatic scroll flag after scroll completes
      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 600)
    }
  }

  // User scroll detection to disable auto-scroll during manual scrolling
  React.useEffect(() => {
    if (!scrollContainerRef.current || !open) return

    const container = scrollContainerRef.current
    
    const handleUserScroll = () => {
      // Ignore programmatic scrolls (like when play button is clicked)
      if (programmaticScrollRef.current) {
        return
      }
      
      // Disable auto-scroll permanently when user scrolls manually
      if (!autoScrollDisabled) {
        setAutoScrollDisabled(true)
      }
    }

    container.addEventListener('scroll', handleUserScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleUserScroll)
    }
  }, [open, autoScrollDisabled])

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

  // Enhanced Intersection Observer to detect which section is in view and update activeTab
  React.useEffect(() => {
    if (!scrollContainerRef.current || !open) return

    const sections = [
      { ref: highlightsSectionRef, tab: 'highlights' as const },
      { ref: customerSectionRef, tab: 'customer' as const },
      { ref: summarySectionRef, tab: 'summary' as const },
      { ref: appointmentSectionRef, tab: 'appointment' as const },
      { ref: transcriptSectionRef, tab: 'transcript' as const }
    ]

    let intersectionData: Array<{ tab: string; ratio: number; boundingRect: DOMRect; top: number }> = []

    const observer = new IntersectionObserver(
      (entries) => {
        // Update intersection data
        entries.forEach((entry) => {
          const sectionInfo = sections.find(s => s.ref.current === entry.target)
          if (sectionInfo) {
            const existingIndex = intersectionData.findIndex(item => item.tab === sectionInfo.tab)
            if (entry.isIntersecting) {
              if (existingIndex >= 0) {
                intersectionData[existingIndex].ratio = entry.intersectionRatio
                intersectionData[existingIndex].boundingRect = entry.boundingClientRect
                intersectionData[existingIndex].top = entry.boundingClientRect.top
              } else {
                intersectionData.push({ 
                  tab: sectionInfo.tab, 
                  ratio: entry.intersectionRatio,
                  boundingRect: entry.boundingClientRect,
                  top: entry.boundingClientRect.top
                })
              }
            } else {
              if (existingIndex >= 0) {
                intersectionData.splice(existingIndex, 1)
              }
            }
          }
        })

        // Determine the most relevant section based on visibility and position
        if (intersectionData.length > 0) {
          // Sort by position (top to bottom)
          intersectionData.sort((a, b) => a.top - b.top)
          
          // Find the section that's most prominently visible
          let bestSection = intersectionData[0]
          
          // If multiple sections are visible, prefer the one with highest ratio
          const highlyVisibleSections = intersectionData.filter(item => item.ratio > 0.3)
          if (highlyVisibleSections.length > 0) {
            bestSection = highlyVisibleSections.reduce((prev, current) => 
              current.ratio > prev.ratio ? current : prev
            )
          }
          
          // Special handling for highlights section when near the top
          const highlightsSection = intersectionData.find(item => item.tab === 'highlights')
          if (highlightsSection && highlightsSection.top <= 150 && highlightsSection.ratio > 0.1) {
            bestSection = highlightsSection
          }

          // Prefer transcript if it is substantially visible
          const transcriptEntry = intersectionData.find(item => item.tab === 'transcript')
          if (transcriptEntry && transcriptEntry.ratio >= 0.01) {
            bestSection = transcriptEntry
          }
          
          setActiveTab(bestSection.tab as 'highlights' | 'customer' | 'summary' | 'appointment' | 'transcript')
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '-80px 0px -80px 0px'
      }
    )

    // Use a timeout to ensure elements are rendered
    const timeoutId = setTimeout(() => {
      sections.forEach(({ ref }) => {
        if (ref.current) {
          observer.observe(ref.current)
        }
      })
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [open, call])
  
  // Additional scroll event listener as backup for tab switching
  React.useEffect(() => {
    if (!scrollContainerRef.current || !open) return

    const handleScroll = () => {
      const container = scrollContainerRef.current
      if (!container) return

      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      
      // Find which section is most visible in the viewport
      const sections = [
        { ref: highlightsSectionRef, tab: 'highlights' as const },
        { ref: customerSectionRef, tab: 'customer' as const },
        { ref: summarySectionRef, tab: 'summary' as const },
        { ref: appointmentSectionRef, tab: 'appointment' as const },
        { ref: transcriptSectionRef, tab: 'transcript' as const }
      ]

      let bestSection = sections[0]
      let bestScore = -1

      sections.forEach(({ ref, tab }) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          
          // Calculate how much of the section is visible
          const sectionTop = rect.top - containerRect.top
          const sectionBottom = rect.bottom - containerRect.top
          
          // Score based on visibility and position
          let score = 0
          
          // If section is fully visible
          if (sectionTop <= 0 && sectionBottom >= containerHeight) {
            score = 100
          }
          // If section is partially visible
          else if (sectionTop < containerHeight && sectionBottom > 0) {
            const visibleHeight = Math.min(sectionBottom, containerHeight) - Math.max(sectionTop, 0)
            score = (visibleHeight / rect.height) * 100
          }
          
          // Bonus for sections near the top
          if (sectionTop <= 100 && sectionTop >= -100) {
            score += 20
          }
          // Strong preference for transcript when visible
          if (tab === 'transcript' && score > 0) {
            score += 25
          }
          
          if (score > bestScore) {
            bestScore = score
            bestSection = { ref, tab }
          }
        }
      })

      if (bestScore > 0 && bestSection.tab !== activeTab) {
        setActiveTab(bestSection.tab)
      }
    }

    const container = scrollContainerRef.current
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial check
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [open, call, activeTab])
  
  // Keep playback time when paused - only reset when drawer closes or call changes
  // Removed the effect that resets currentPlaybackTime to 0 when paused
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
      // Reset audio duration to ensure fresh start
      setActualAudioDuration(0)
      // Reset to highlights tab
      setActiveTab('highlights')
      
      // Reset programmatic scroll flag after state changes complete
      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 100)
    }
  }, [open]) // Only depend on 'open' to ensure it triggers every time drawer opens

  // Additional cleanup when drawer closes
  React.useEffect(() => {
    if (!open) {
      // Reset all state when drawer closes to ensure fresh start next time
      setAutoScrollDisabled(false)
      setActiveTab('highlights')
      programmaticScrollRef.current = false
    }
  }, [open])



  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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

  // Enhanced dummy data for comprehensive display
  const getDummyData = () => {
    return {
      customerIntent: [
        "Schedule test drive appointment",
        "Looking for vehicle options in the price range of $25,000 to $35,000",
        "Interested in trade-in evaluation for current vehicle",
        "Requesting financing options and payment plans",
        "Inquiring about extended warranty packages"
      ],
      appointmentDetails: [
        "Test drive scheduled for Tuesday, Dec 12 at 2:00 PM",
        "Sales consultation scheduled for Friday, Dec 15 at 10:30 AM",
        "Finance meeting scheduled for Monday, Dec 18 at 3:00 PM"
      ],
      engagement: [
        "Responded positively to test drive invitation",
        "Provided email and WhatsApp number for follow-up communication",
        "Requested brochures and pricing information via email",
        "Showed high interest in safety features and fuel efficiency"
      ],
      serviceDetails: {
        requested: "Yes - Brake Inspection & Oil Change",
        lastServiceDate: "2024-10-15",
        serviceType: "Brake Inspection, Oil Change, Tire Rotation",
        urgency: "High - Customer reported brake noise",
        pickupDrop: "Pickup & Drop-off requested",
        escalations: "Frustrated with previous service delay (3 weeks ago)",
        assignedTo: {
          name: "James Austin",
          initials: "JA",
          role: "Senior Service Advisor"
        }
      }
    }
  }

  const dummyData = getDummyData()

  // Helper function to normalize transcript data from different sources
  const getNormalizedTranscript = React.useCallback(() => {
    if (!call) return []
    
    try {
      // Priority 1: Use API callDetails.messages (same as main call cards)
      if (callDetails?.callDetails?.messages && callDetails.callDetails.messages.length > 0) {
        const validMessages = callDetails.callDetails.messages.filter((msg: any) => 
          msg.message && msg.message.trim().length > 0
        )
        
        if (validMessages.length === 0) return []
        
        return validMessages.map((msg: any, index: number) => ({
          speaker: msg.role === 'bot' ? 'Agent' : 'Customer',
          text: msg.message,
          timestamp: Math.round(msg.secondsFromStart || (msg.time ? msg.time / 1000 : index * 10)),
          duration: msg.duration ? Math.round(msg.duration / 1000) : undefined
        }))
      }
      // Priority 2: Use API callDetails.formattedMessages
      else if (callDetails?.callDetails?.formattedMessages && callDetails.callDetails.formattedMessages.length > 0) {
        const validMessages = callDetails.callDetails.formattedMessages.filter((msg: any) => 
          msg.content && msg.content.trim().length > 0
        )
        
        if (validMessages.length === 0) return []
        
        return validMessages.map((msg: any, index: number) => ({
          speaker: msg.role === 'bot' ? 'Agent' : 'Customer',
          text: msg.content,
          timestamp: Math.round(msg.secondsFromStart || (msg.time ? msg.time / 1000 : index * 10)),
          duration: msg.duration ? Math.round(msg.duration / 1000) : undefined
        }))
      }
      // Priority 3: Fallback to call.transcript if available
      else if (call.transcript && call.transcript.length > 0) {
        const validTranscript = call.transcript.filter(entry => 
          entry.text && entry.text.trim().length > 0
        )
        return validTranscript
      }
      return []
    } catch (error) {
      return []
    }
  }, [call, callDetails])

  const normalizedTranscript = React.useMemo(() => getNormalizedTranscript(), [getNormalizedTranscript])

  // Resolve and memoize the audio URL used by the hidden player
  const resolvedAudioUrl = React.useMemo(() => {
    // Use the raw recording URL, matching the card view player which works.
    if (!call) return ''
    return call.voice_recording_url || call.recording_url || ''
  }, [call?.voice_recording_url, call?.recording_url])

  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('')
  const [triedRawFallback, setTriedRawFallback] = useState(false)

  React.useEffect(() => {
    // Reset when call changes
    setActiveAudioUrl(resolvedAudioUrl)
    setTriedRawFallback(false)
  }, [resolvedAudioUrl, call?.call_id])

  React.useEffect(() => {
    if (call) {
      try {
      } catch {}
    }
  }, [call?.call_id, activeAudioUrl, resolvedAudioUrl])
  
  // Auto-scroll to current transcript entry during playback
  React.useEffect(() => {
    if (!isPlaying || !normalizedTranscript.length || autoScrollDisabled) {
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
  }, [currentPlaybackTime, isPlaying, activeTab, normalizedTranscript, autoScrollDisabled])

  // Auto-switch tabs based on top visible section
  React.useEffect(() => {
    
    // Reset autoScrollDisabled when user starts scrolling naturally
    if (autoScrollDisabled && !programmaticScrollRef.current) {
      setAutoScrollDisabled(false)
    }
    
    if (programmaticScrollRef.current) {
      return
    }

    const updateActiveTab = () => {
      // Get the scroll container
      const container = scrollContainerRef.current
      if (!container) {
        return
      }

      // Get all section refs in order
      const sections = [
        { ref: highlightsSectionRef, tab: 'highlights' as const },
        { ref: customerSectionRef, tab: 'customer' as const },
        { ref: summarySectionRef, tab: 'summary' as const },
        { ref: appointmentSectionRef, tab: 'appointment' as const },
        { ref: transcriptSectionRef, tab: 'transcript' as const }
      ]

      // Get the container's viewport
      const containerRect = container.getBoundingClientRect()
      const containerTop = containerRect.top
      const viewportTop = containerTop + 50 // Small padding from top of container


      let activeSection: 'highlights' | 'customer' | 'summary' | 'appointment' | 'transcript' = 'highlights'
      let closestSection: 'highlights' | 'customer' | 'summary' | 'appointment' | 'transcript' = 'highlights'
      let minDistance = Infinity

      // Find the section that's closest to the top of the viewport
      sections.forEach(({ ref, tab }) => {
        if (ref.current) {
          const sectionRect = ref.current.getBoundingClientRect()
          const sectionTop = sectionRect.top
          const sectionBottom = sectionRect.bottom
          
          // Calculate distance from section top to viewport top
          const distance = Math.abs(sectionTop - viewportTop)
          
          
          // If this section is visible (not completely above viewport) and closer to top
          if (sectionTop <= viewportTop + 200 && distance < minDistance) {
            minDistance = distance
            closestSection = tab
          }
          
          // If section top is at or above viewport top, this should be the active section
          if (sectionTop <= viewportTop) {
            activeSection = tab
          }
        } else {
        }
      })

      // Use the section that's closest to the top if no section is above viewport
      if (activeSection === 'highlights' && closestSection !== 'highlights') {
        activeSection = closestSection
      }


      // Only switch if we're not already on the target tab
      if (activeSection !== activeTab) {
        setActiveTab(activeSection)
      } else {
      }
    }

    // Update immediately
    updateActiveTab()

    // Listen for scroll events
    const container = scrollContainerRef.current
    if (container) {
      const handleScroll = () => {
        if (!programmaticScrollRef.current) {
          updateActiveTab()
        } else {
        }
      }

      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    } else {
    }
  }, [activeTab, autoScrollDisabled])

  // Reset autoScrollDisabled when user scrolls naturally
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // If user is scrolling naturally (not programmatically), re-enable auto-scroll
      if (!programmaticScrollRef.current && autoScrollDisabled) {
        setAutoScrollDisabled(false)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [autoScrollDisabled])
  
  // Auto-start playback when triggered from table view
  React.useEffect(() => {
    if (autoStartPlayback && call && open && normalizedTranscript.length > 0) {
      // Switch to transcript tab first
      setActiveTab('transcript')
      setAutoScrollDisabled(false)
      
      // Start playing after a short delay to ensure tab is switched
      setTimeout(() => {
        if (drawerAudioPlayerRef.current && drawerAudioPlayerRef.current.play) {
          drawerAudioPlayerRef.current.play()
        }
        // Inform parent that drawer started playing
        if (call && typeof onPlayStateChange === 'function') onPlayStateChange(call, true)
        
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
      }, 300)
    }
  }, [autoStartPlayback, call, open, normalizedTranscript.length, onPlayStateChange, onAutoStartComplete])

  // When parent wants us to seek immediately after auto-start (e.g., waveform click in table)
  React.useEffect(() => {
    const maybeSeek = () => {
      const seekTime = (audioRef && typeof audioRef === 'object' && (audioRef as any).current && (audioRef as any).current.seek) ? undefined : undefined
    }
  }, [audioRef])


  const getTopHighlights = React.useMemo(() => {
    if (!call) return { highlights: [], totalCount: 0 }
    
    const highlights: string[] = []
    
    // Priority 1: Use API reports -> summary array when available
    if (callDetails?.report?.summary && callDetails.report.summary.length > 0) {
      // Add all summary items from the API
      callDetails.report.summary.forEach((summaryItem: any, index: number) => {
        if (summaryItem && summaryItem.trim() !== '') {
          highlights.push(summaryItem.trim())
        }
      })
    }
    
    // Priority 2: Use detailed API analysis summary if no report summary
    if (highlights.length === 0 && callDetails?.callDetails?.analysis?.summary) {
      highlights.push(callDetails.callDetails.analysis.summary)
    }
    
    // Priority 3: Fallback to existing call summary
    if (highlights.length === 0 && call.summary && call.summary !== 'No summary available' && call.summary !== 'Call received but the customer did not provide any information or respond to agent prompts.') {
      highlights.push(call.summary)
    }
    
    // Fallback highlights if no real data
    if (highlights.length === 0) {
      return { highlights: ['No key highlights available for this call'], totalCount: 0 }
    }
    
    const totalCount = highlights.length
    
    // Return all highlights and total count
    return { 
      highlights, 
      totalCount 
    }
  }, [callDetails, call])

  // Early return if no call data
  if (!call) {
    return null
  }
  

  // Use the passed helper functions to get consistent data
  const agent = getAgentDetails(call.call_id)
  const summary = getCallSummary(call)
  const callTitle = getCallTitleProp(call)
  const vehicleInfo = getVehicleInfo(call)
  const nextAction = getNextAction(call)
  const potentialRevenue = getPotentialRevenue(call)
  const formattedRevenue = formatRevenue(potentialRevenue)
  const timeAgo = getTimeAgo(call)

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gray-50/50 overscroll-contain">
        {/* Sticky Header + Recording + Tabs */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-0">
          <div className="px-6 pt-2 pb-6">
            {/* Close Button - Positioned in top right */}
            <div className="flex justify-end mb-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Call Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 leading-tight break-words mb-3">
                  {callTitle}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeAgo(call)}</span>
                  <User className="h-4 w-4" />
                  <span>{getAgentDetails(call.call_id).name}</span>
                </div>
              </div>
              {detailsLoading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}
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
      
      {/* Recording Section */}
      {(call.voice_recording_url || call.recording_url) && (
        <div className="bg-white">
          <div className="px-6 py-2">
            <div className="space-y-3">

              
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                {/* Player Controls */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0"
                  style={{
                    backgroundColor: '#4600f2',
                    borderColor: '#4600f2',
                    color: 'white'
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
                      console.warn('No audio URL available for call', call.call_id)
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
                  {formatDuration(currentPlaybackTime)} / {formatDuration(actualAudioDuration || call.metrics.duration_sec)}
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
                      const newTime = Math.floor(clickPercentage * (actualAudioDuration || call.metrics.duration_sec))
                      
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
                      const previewTime = Math.floor(mousePercentage * (actualAudioDuration || call.metrics.duration_sec))
                      
                      // Update the title to show the preview time
                      e.currentTarget.title = `Click to jump to ${formatDuration(previewTime)}`
                    }}
                  >
                    {Array.from({ length: 100 }, (_, i) => (
                      <div
                        key={i}
                        className={`transition-all duration-300 ${
                          i <= (currentPlaybackTime / (actualAudioDuration || call.metrics.duration_sec) * 100) ? 'bg-[#4600f2]' : 'bg-gray-300'
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
                  {/* Progress Line */}
                  {currentPlaybackTime > 0 && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-[#4600f2] z-10 transition-all duration-300"
                      style={{ left: `${(currentPlaybackTime / (actualAudioDuration || call.metrics.duration_sec)) * 100}%` }}
                    />
                  )}
                </div>
                
                {/* Wavesurfer AudioPlayer for actual audio playback (consistent with card view) */}
                {(call.voice_recording_url || call.recording_url) && (
                  <div className="mt-1">
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
                        console.warn('Audio playback error:', msg, 'url:', activeAudioUrl || resolvedAudioUrl)
                      }}
                      onPlay={() => {
                        if (call && typeof onPlayStateChange === 'function') onPlayStateChange(call, true)
                      }}
                      onPause={() => {
                        if (call && typeof onPlayStateChange === 'function') onPlayStateChange(call, false)
                      }}
                    />
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
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative ${
                activeTab === 'highlights'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Highlights
              {activeTab === 'highlights' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => scrollToSection(customerSectionRef, 'customer')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative ${
                activeTab === 'customer'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer
              {activeTab === 'customer' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => scrollToSection(summarySectionRef, 'summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative ${
                activeTab === 'summary'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summary
              {activeTab === 'summary' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full animate-pulse" />
              )}
            </button>

            <button
              onClick={() => scrollToSection(appointmentSectionRef, 'appointment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative ${
                activeTab === 'appointment'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointment
              {activeTab === 'appointment' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => scrollToSection(transcriptSectionRef, 'transcript')}
              disabled={normalizedTranscript.length === 0}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap relative ${
                activeTab === 'transcript'
                  ? 'border-[#4600f2] text-[#4600f2]'
                  : normalizedTranscript.length === 0
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={normalizedTranscript.length === 0 ? 'No transcript available' : 'View transcript'}
            >
              Transcript
              {activeTab === 'transcript' && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-[#4600f2] rounded-full animate-pulse" />
              )}
            </button>
          </nav>
        </div>
      </div>
        </div>

      {/* Content Area */}
      <div className="flex-none">
        <div className="px-6 py-6">

          {detailsLoading ? (
            <RightPanelShimmer />
          ) : (
            <div className="space-y-8">
              {/* Key Highlights */}
              <div ref={highlightsSectionRef} className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-700/30" />
                  Key Highlights
                </h3>
                
                <div className="bg-gray-50/50 rounded-lg p-5 border border-gray-100">
                  <ul className="space-y-4">
                    {getTopHighlights.highlights.map((highlight, index) => (
                      <li key={index} className="flex gap-4">
                        <span className="text-gray-400 font-medium text-sm mt-0.5 flex-shrink-0 w-4">{index + 1}.</span>
                        <span className="text-sm text-gray-700 leading-relaxed">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Customer Information */}
              <div ref={customerSectionRef} className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-700/30" />
                  Customer Information
                </h3>
                
                <div className="border border-gray-200 rounded-lg p-5 bg-white space-y-4">
                  {/* Customer Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-500 mb-1">Customer Name</div>
                      <div className="text-sm font-medium text-gray-900">
                        {getCustomerDisplayName(call)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone Number */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-500 mb-1">Phone Number</div>
                      <div className={`text-sm font-mono ${getCustomerDisplayPhone(call) !== "Called from Web" ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {getCustomerDisplayPhone(call)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Email */}
                  {call.customer.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">Email Address</div>
                        <div className="text-sm text-gray-900">
                          {call.customer.email}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show message if no contact information is available */}
                  {!call.customer.email && !call.customer.phone && (
                    <div className="text-center py-3">
                      <div className="text-sm text-gray-500">
                        Limited contact information available
                      </div>
                    </div>
                  )}
                </div>
              </div>





              {/* Call Summary */}
              <div ref={summarySectionRef} className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-700/30" />
                  Summary & Action Items
                </h3>
                
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="text-xs font-medium text-gray-500 mb-2">Call Summary</div>
                    <div className="text-sm text-gray-900 leading-relaxed">
                      {summary}
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-[#4600f2] bg-[#4600f2]/5 rounded-r-lg p-4">
                    <div className="text-xs font-semibold text-[#4600f2] uppercase tracking-wide mb-2">Next Action Required</div>
                    <div className="text-sm text-gray-900 leading-relaxed">
                      {nextAction && nextAction !== "No next action specified" ? (
                        <ul className="space-y-1">
                          {nextAction.split('\n').filter(item => item.trim().length > 0).map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-[#4600f2] mt-0">•</span>
                              <span>{item.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div>{nextAction || "No next action specified"}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Performance Analysis */}
              {callDetails?.report?.overview?.overall?.aiResponseQuality && 
               !isNaN(parseFloat(callDetails.report.overview.overall.aiResponseQuality.score)) &&
               !isNaN(parseFloat(callDetails.report.overview.overall.aiResponseQuality.metrics.responseRelevanceAndClarity)) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-gray-700/30" />
                    AI Performance Analysis
                  </h3>
                  
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Overall Score</div>
                        <div className={`text-lg font-semibold ${
                          parseFloat(callDetails.report.overview.overall.aiResponseQuality.score) >= 8 ? 'text-green-600' :
                          parseFloat(callDetails.report.overview.overall.aiResponseQuality.score) >= 6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {parseFloat(callDetails.report.overview.overall.aiResponseQuality.score).toFixed(1)} / 10
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Relevance & Clarity</div>
                        <div className={`text-lg font-semibold ${
                          parseFloat(callDetails.report.overview.overall.aiResponseQuality.metrics.responseRelevanceAndClarity) >= 8 ? 'text-green-600' :
                          parseFloat(callDetails.report.overview.overall.aiResponseQuality.metrics.responseRelevanceAndClarity) >= 6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {parseFloat(callDetails.report.overview.overall.aiResponseQuality.metrics.responseRelevanceAndClarity).toFixed(1)} / 10
                        </div>
                      </div>
                    </div>
                    
                    {callDetails.report.overview.overall.aiResponseQuality.whatAiDidBetter?.filter((item: any) => item && item.trim().length > 0).length > 0 && (
                      <div className="border-l-4 border-green-500 bg-green-500/5 rounded-r-lg p-4 mb-4">
                        <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">What AI Did Well</div>
                        <ul className="space-y-1">
                          {callDetails.report.overview.overall.aiResponseQuality.whatAiDidBetter.filter((item: any) => item && item.trim().length > 0).map((item: any, index: number) => (
                            <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                              <span className="text-green-600 mt-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {callDetails.report.overview.overall.aiResponseQuality.whatAiCouldHaveDoneBetter?.filter((item: any) => item && item.trim().length > 0).length > 0 && (
                      <div className="border-l-4 border-amber-500 bg-amber-500/5 rounded-r-lg p-4">
                        <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Areas for Improvement</div>
                        <ul className="space-y-1">
                          {callDetails.report.overview.overall.aiResponseQuality.whatAiCouldHaveDoneBetter.filter((item: any) => item && item.trim().length > 0).map((item: any, index: number) => (
                            <li key={index} className="text-sm text-gray-900 flex items-start gap-2">
                              <span className="text-amber-600 mt-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Appointment Details */}
              <div ref={appointmentSectionRef} className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-700/30" />
                  Appointment
                </h3>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
                      <div className="text-sm text-gray-900 capitalize">
                        {call.appointment?.type ? call.appointment.type.replace(/_/g, ' ') : "Not specified"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Status</div>
                      <div className="text-sm text-gray-900 capitalize">
                        {call.appointment?.status || "No status"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Date & Time</div>
                      <div className="text-sm text-gray-900">
                        {call.appointment?.starts_at ? formatDateTime(call.appointment.starts_at) : "Not scheduled"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript Section */}
              {normalizedTranscript.length > 0 ? (
                <div ref={transcriptSectionRef} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-700/30" />
                    Transcript
                    {detailsLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-600 ml-2" />}

                  </h3>
                  
                  {/* Transcript Cards */}
                  <div className="space-y-4">
                    {normalizedTranscript.map((entry: any, index: number) => {
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
                            
                            // Only seek if we have a valid timestamp and audio player
                            if (entry.timestamp && drawerAudioPlayerRef.current) {
                              // Seek to the timestamp of this transcript entry
                              if (drawerAudioPlayerRef.current.seek) {
                                drawerAudioPlayerRef.current.seek(entry.timestamp)
                                setCurrentPlaybackTime(entry.timestamp)
                                
                                // Auto-play the audio from this position
                                setTimeout(() => {
                                  if (drawerAudioPlayerRef.current && drawerAudioPlayerRef.current.play) {
                                    try {
                                      drawerAudioPlayerRef.current.play()
                                      // The AudioPlayer's onPlay callback will automatically sync with parent state
                                      // No need to manually call onPlayCall since it would toggle the state
                                    } catch (error) {
                                      console.error('Error starting audio playback:', error)
                                    }
                                  }
                                }, 100) // Small delay to ensure seek completes first
                                
                                // Keep background consistent; no temporary white/flash on click
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
                                  : (entry.speaker.toLowerCase().includes('agent') || entry.speaker.toLowerCase().includes('bot') || entry.speaker.toLowerCase().includes('mia') 
                                      ? 'bg-purple-200 text-purple-700' : 'bg-green-200 text-green-700')
                              }`}>
                                {entry.speaker.toLowerCase().includes('agent') || entry.speaker.toLowerCase().includes('bot') || entry.speaker.toLowerCase().includes('mia') 
                                  ? getAgentDetails(call.call_id).avatar 
                                  : getCustomerInitials(call)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-3 mb-2">
                                  <span className={`font-semibold ${isCurrentlyPlaying ? 'text-[#4600f2]' : 'text-gray-900'}`}>
                                    {entry.speaker.toLowerCase().includes('agent') || entry.speaker.toLowerCase().includes('bot') || entry.speaker.toLowerCase().includes('mia') ? 'Agent' : entry.speaker}
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
              ) : (
                <div ref={transcriptSectionRef} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-700/30" />
                    Transcript
                    {detailsLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-600 ml-2" />}
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p className="text-sm text-gray-500">
                      {detailsLoading ? 'Loading transcript...' : 'No transcript available for this call'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
