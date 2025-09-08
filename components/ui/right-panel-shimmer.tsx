import React from "react"
import { Shimmer, ShimmerText, ShimmerCard, ShimmerBadge, ShimmerButton, ShimmerAvatar, ShimmerTranscriptEntry } from "./shimmer"

export function RightPanelShimmer() {
  return (
    <div className="space-y-6">
      {/* Header Shimmer */}
      <div className="space-y-4">
        {/* Title Shimmer */}
        <div className="space-y-2">
          <ShimmerText className="w-3/4" lines={1} />
          <ShimmerText className="w-1/2" lines={1} />
        </div>
        
        {/* Call Metadata Shimmer */}
        <div className="flex items-center gap-2">
          <ShimmerBadge />
          <ShimmerBadge />
          <ShimmerBadge />
        </div>
      </div>

      {/* Tabs Shimmer */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerButton key={i} className="h-8 w-20" />
          ))}
        </div>
      </div>

      {/* Content Shimmer */}
      <div className="space-y-6">
        {/* Highlights Section Shimmer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <ShimmerText className="w-32" lines={1} />
          </div>
          
          <div className="space-y-3">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </div>

        {/* Customer Information Shimmer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <ShimmerText className="w-40" lines={1} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <ShimmerAvatar />
                <div className="flex-1 space-y-2">
                  <ShimmerText className="w-16" lines={1} />
                  <ShimmerText className="w-24" lines={1} />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50/60 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <ShimmerAvatar />
                <div className="flex-1 space-y-2">
                  <ShimmerText className="w-16" lines={1} />
                  <ShimmerText className="w-28" lines={1} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Performance Analysis Shimmer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <ShimmerText className="w-48" lines={1} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShimmerText className="w-8" lines={1} />
                </div>
                <div className="flex-1 space-y-2">
                  <ShimmerText className="w-24" lines={1} />
                  <ShimmerText className="w-12" lines={1} />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50/60 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShimmerText className="w-8" lines={1} />
                </div>
                <div className="flex-1 space-y-2">
                  <ShimmerText className="w-28" lines={1} />
                  <ShimmerText className="w-12" lines={1} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50/60 rounded-lg p-4 border border-green-100">
            <ShimmerText className="w-32" lines={1} />
            <div className="space-y-2 mt-2">
              <ShimmerText className="w-full" lines={1} />
              <ShimmerText className="w-5/6" lines={1} />
            </div>
          </div>
        </div>

        {/* Call Status Shimmer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <ShimmerText className="w-28" lines={1} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </div>

        {/* Transcript Shimmer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <ShimmerText className="w-24" lines={1} />
          </div>
          
          <div className="space-y-4">
            <ShimmerTranscriptEntry />
            <ShimmerTranscriptEntry />
            <ShimmerTranscriptEntry />
          </div>
        </div>
      </div>
    </div>
  )
}
