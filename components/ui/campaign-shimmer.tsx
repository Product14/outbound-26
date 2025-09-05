import React from "react"
import { cn } from "@/lib/utils"
import { Shimmer, ShimmerText, ShimmerCard, ShimmerBadge, ShimmerButton, ShimmerAvatar } from "./shimmer"

export function CampaignHeaderShimmer() {
  return (
    <div className="bg-white border-b border-gray-100 px-8 py-4">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex items-end justify-between w-full max-w-[720px]">
          <div className="flex flex-col gap-6">
            {/* Breadcrumb and Title Section */}
            <div className="flex flex-col gap-2">
              {/* Breadcrumb */}
              <div className="flex items-center gap-3">
                <Shimmer className="w-6 h-6 bg-gray-200 rounded" />
                <div className="flex items-center gap-1">
                  <ShimmerText className="w-16" lines={1} />
                  <span className="text-black">/</span>
                  <ShimmerText className="w-24" lines={1} />
                </div>
              </div>
              
              {/* Title and Status */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <ShimmerText className="w-48 h-8" lines={1} />
                  <Shimmer className="w-[30px] h-[30px] bg-gray-200 rounded-full" />
                </div>
                <ShimmerBadge className="w-16" />
              </div>
            </div>
          </div>
          
          {/* Stop Campaign Button */}
          <div className="flex items-center gap-4">
            <ShimmerButton className="w-32 h-9" />
          </div>
        </div>
        
        {/* Campaign Details Section */}
        <div className="flex flex-col gap-5 w-full">
          {/* Scheduled for */}
          <div className="flex items-center">
            <div className="w-[150px]">
              <ShimmerText className="w-24" lines={1} />
            </div>
            <div className="flex items-center gap-2">
              <ShimmerText className="w-32" lines={1} />
              <span className="text-gray-600">to</span>
              <ShimmerText className="w-32" lines={1} />
            </div>
          </div>
          
          {/* Call Disposition */}
          <div className="flex items-center">
            <div className="w-[150px]">
              <ShimmerText className="w-28" lines={1} />
            </div>
            <ShimmerBadge className="w-36" />
          </div>
          
          {/* Created on */}
          <div className="flex items-center">
            <div className="w-[150px]">
              <ShimmerText className="w-20" lines={1} />
            </div>
            <ShimmerText className="w-40" lines={1} />
          </div>
          
          {/* Agents Deployed */}
          <div className="flex items-center">
            <div className="w-[150px]">
              <ShimmerText className="w-32" lines={1} />
            </div>
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <ShimmerAvatar className="w-6 h-6" />
                  <ShimmerText className="w-8" lines={1} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CampaignTabsShimmer() {
  return (
    <div className="py-2">
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <ShimmerButton className="w-24 h-8 mb-4" />
        <ShimmerButton className="w-20 h-8 mb-4" />
      </div>
    </div>
  )
}

export function AnalyticsContentShimmer() {
  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Campaign Overview */}
        <div className="border-0 bg-white rounded-[16px] p-6 border border-gray-100">
          <ShimmerText className="w-48 h-6 mb-4" lines={1} />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                <Shimmer className="w-9 h-9 bg-gray-200 rounded-[8px]" />
                <div className="flex-1 space-y-2">
                  <ShimmerText className="w-full" lines={1} />
                  <ShimmerText className="w-16 h-6" lines={1} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Funnel */}
        <div className="border-0 bg-white rounded-[16px] p-6 border border-gray-100">
          <ShimmerText className="w-32 h-6 mb-4" lines={1} />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shimmer className="w-8 h-8 bg-gray-200 rounded" />
                  <ShimmerText className="w-24" lines={1} />
                </div>
                <ShimmerText className="w-12" lines={1} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="border-0 bg-white rounded-[16px] p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <ShimmerText className="w-40 h-6" lines={1} />
          <ShimmerButton className="w-24" />
        </div>
        <Shimmer className="w-full h-64 bg-gray-200 rounded-lg" />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Performing */}
        <div className="border-0 bg-white rounded-[16px] p-6 border border-gray-100">
          <ShimmerText className="w-36 h-6 mb-4" lines={1} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <ShimmerText className="w-32" lines={1} />
                <ShimmerText className="w-16" lines={1} />
              </div>
            ))}
          </div>
        </div>

        {/* Another section */}
        <div className="border-0 bg-white rounded-[16px] p-6 border border-gray-100">
          <ShimmerText className="w-32 h-6 mb-4" lines={1} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <ShimmerText className="w-28" lines={1} />
                <ShimmerText className="w-12" lines={1} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LiveCallsContentShimmer() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
        <ShimmerButton className="w-48 h-10" />
        <ShimmerButton className="w-32 h-10" />
        <ShimmerButton className="w-28 h-10" />
        <ShimmerButton className="w-24 h-10" />
        <ShimmerButton className="w-20 h-10" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100">
        {/* Table Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ShimmerText key={i} className="w-24" lines={1} />
          ))}
        </div>
        
        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-b-0">
            <ShimmerAvatar className="w-8 h-8" />
            <ShimmerText className="w-32" lines={1} />
            <ShimmerBadge className="w-16" />
            <ShimmerText className="w-24" lines={1} />
            <ShimmerText className="w-20" lines={1} />
            <ShimmerButton className="w-16 h-6" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CampaignPageShimmer() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Campaign Header - Outside the padded container */}
      <CampaignHeaderShimmer />
      
      {/* Content Area with padding */}
      <div className="px-12 py-8 bg-[#F4F5F8] min-h-screen">
        {/* Tabs */}
        <CampaignTabsShimmer />
        
        {/* Content - Default to Live Calls */}
        <LiveCallsContentShimmer />
      </div>
    </div>
  )
}

export function CampaignListShimmer() {
  return (
    <div className="space-y-6">
      {/* Campaigns grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-[16px] border border-gray-100 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <ShimmerText className="w-3/4 h-5" lines={1} />
                <div className="flex items-center gap-2">
                  <ShimmerBadge className="w-16" />
                  <ShimmerBadge className="w-12" />
                </div>
              </div>
              <Shimmer className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <ShimmerText className="w-16 h-4" lines={1} />
                <ShimmerText className="w-12 h-6" lines={1} />
              </div>
              <div className="space-y-1">
                <ShimmerText className="w-20 h-4" lines={1} />
                <ShimmerText className="w-16 h-6" lines={1} />
              </div>
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <ShimmerText className="w-16 h-4" lines={1} />
                <ShimmerText className="w-8 h-4" lines={1} />
              </div>
              <Shimmer className="w-full h-2 bg-gray-200 rounded-full" />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <ShimmerAvatar className="w-6 h-6" />
                <ShimmerText className="w-20 h-4" lines={1} />
              </div>
              <ShimmerText className="w-16 h-4" lines={1} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CSVMappingShimmer() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <Shimmer className="w-8 h-8 bg-gray-200 rounded-full" />
            {i < 3 && <Shimmer className="w-16 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-100 p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Shimmer className="w-8 h-8 bg-gray-200 rounded-full" />
          <div className="text-center space-y-2">
            <ShimmerText className="w-64 h-6" lines={1} />
            <ShimmerText className="w-48 h-4" lines={1} />
          </div>
        </div>
      </div>
    </div>
  )
}
