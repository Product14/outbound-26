"use client";

import React, { useState } from 'react';
import { Clock, BarChart3, Search, ChevronDown, List, PhoneCall, Timer, PhoneOff, Voicemail, X, Filter, PhoneMissed, Ban } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabsNavigationProps {
  tabs?: Tab[];
  defaultActiveTab?: string;
  onTabChange?: (tabId: string) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  // Existing functionality props
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  statusFilter?: string[];
  setStatusFilter?: (value: string[]) => void;
  // Callback to toggle additional filters in LiveActivityFilters
  onToggleFilters?: () => void;
}

export function TabsNavigation({
  tabs = [
    { id: 'live-calls', label: 'Live Calls & Queue', icon: <Clock size={15} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> }
  ],
  defaultActiveTab = 'live-calls',
  onTabChange,
  showSearch = true,
  showFilters = true,
  searchTerm = '',
  setSearchTerm,
  statusFilter = ['all'],
  setStatusFilter,
  onToggleFilters
}: TabsNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  // Sync with external tab state
  React.useEffect(() => {
    setActiveTab(defaultActiveTab);
  }, [defaultActiveTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  // Connection status options for multi-select
  const connectionOptions: MultiSelectOption[] = [
    { value: 'all', label: 'All Connections', icon: <List className="h-4 w-4 text-gray-500" /> },
    { value: 'connected', label: 'Connected', icon: <PhoneCall className="h-4 w-4 text-green-600" /> },
    { value: 'live', label: 'Live', icon: <div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div></div> },
    { value: 'queue', label: 'Queue', icon: <Timer className="h-4 w-4 text-blue-600" /> },
    { value: 'not_connected', label: 'Not Connected', icon: <PhoneOff className="h-4 w-4 text-gray-600" /> },
    { value: 'voice_mail', label: 'Voice Mail', icon: <Voicemail className="h-4 w-4 text-yellow-600" /> },
    { value: 'call_failed', label: 'Call Failed', icon: <X className="h-4 w-4 text-red-600" /> },
    { value: 'busy', label: 'Busy', icon: <PhoneMissed className="h-4 w-4 text-orange-600" /> },
    { value: 'do_not_call', label: 'Do Not Call', icon: <Ban className="h-4 w-4 text-red-600" /> }
  ];

  return (
    <div className="bg-white relative w-full border-b border-black/[0.06]">
      <div className="flex items-end justify-between px-8 py-0 h-full">
        {/* Left side - Tabs */}
        <div className="flex flex-row items-end h-full">
          <div className="flex gap-6 h-full items-center">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex gap-2.5 h-full items-center cursor-pointer relative ${
                  activeTab === tab.id ? 'border-b-2 border-neutral-950' : ''
                }`}
                onClick={() => handleTabClick(tab.id)}
              >
                {activeTab === tab.id ? (
                  // Active tab styling
                  <div className="bg-[rgba(72,80,102,0.04)] border border-[rgba(0,0,0,0.04)] flex gap-2.5 items-center justify-center pl-2 pr-3 py-1.5 rounded-[6px]">
                    <div className="shrink-0">
                      {tab.icon}
                    </div>
                    <div className="font-semibold text-[14px] text-[rgba(0,0,0,0.8)] tracking-[0.0449px] leading-5">
                      {tab.label}
                    </div>
                  </div>
                ) : (
                  // Inactive tab styling
                  <div className="flex gap-2 items-center px-0 py-1">
                    <div className="shrink-0 text-[#8f8f8f]">
                      {tab.icon}
                    </div>
                    <div className="font-medium text-[14px] text-[#8f8f8f] tracking-[0.0449px] leading-5">
                      {tab.label}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex items-center gap-3 py-3">
            {showSearch && (
              <div className="bg-[rgba(255,255,255,0.9)] border border-[rgba(0,9,50,0.12)] flex items-center px-1 py-0 rounded-[6px] w-[200px] h-8">
                <div className="flex items-center justify-center px-1 py-0">
                  <Search size={20} className="text-[rgba(0,5,29,0.45)]" />
                </div>
                <div className="flex-1 px-1 py-0">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm?.(e.target.value)}
                    className="w-full bg-transparent text-[14px] text-[rgba(0,5,29,0.45)] leading-5 outline-none font-normal"
                    style={{ fontFamily: 'SF Pro, sans-serif' }}
                  />
                </div>
              </div>
            )}
            
            {showFilters && (
              <>
                <div 
                  className="bg-[rgba(255,255,255,0.9)] border border-[rgba(0,0,0,0.1)] flex items-center gap-[4.492px] px-3 py-1.5 rounded-[8px] cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={onToggleFilters}
                >
                  <Filter size={16} className="text-gray-600" />
                  <div className="font-medium text-[14px] text-neutral-950 tracking-[0.0449px] leading-5">
                    Filters
                  </div>
                  <ChevronDown size={17.677} />
                </div>
                
                <MultiSelect
                  options={connectionOptions}
                  selected={statusFilter}
                  onChange={(value) => setStatusFilter?.(value)}
                  placeholder="All Connections"
                  className="bg-[rgba(255,255,255,0.9)] border border-[rgba(0,0,0,0.1)] h-auto px-3 py-1.5 rounded-[8px] w-auto min-w-[200px]"
                  maxDisplay={1}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
