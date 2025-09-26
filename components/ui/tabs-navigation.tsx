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
        <div className="flex items-center space-x-8 flex-1 min-w-0 pb-0 border-0 border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <div key={tab.id} className="relative flex items-center">
              <div className="flex items-center pb-3">
                <button
                  onClick={() => handleTabClick(tab.id)}
                  className={`text-base transition-colors ${
                    activeTab === tab.id 
                      ? 'text-black font-semibold' 
                      : 'text-black/40 font-medium hover:text-black/60'
                  }`}
                >
                  {tab.label}
                </button>
              </div>
              {activeTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5" 
                  style={{ backgroundColor: 'rgb(70, 0, 242)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Right side - Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex items-center gap-3 py-3">
            {showSearch && (
              <div className="flex items-center w-[200px] h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 ease-out focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
                <div className="flex items-center justify-center pr-2">
                  <Search size={16} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm?.(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none font-normal"
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
