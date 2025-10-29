export interface UrlParams {
  enterprise_id: string | null;
  team_id: string | null;
  auth_key: string | null;
  tab: string | null;
  callDetailsTab: string | null;
  selectedCall: string | null;
  // Filter parameters
  search?: string | null;
  status?: string | null;
  connection?: string | null;
  outcome?: string | null;
  page?: string | null;
  limit?: string | null;
}

export function extractUrlParams(): UrlParams {
  if (typeof window === 'undefined') {
    return {
      enterprise_id: null,
      team_id: null,
      auth_key: null,
      tab: null,
      callDetailsTab: null,
      selectedCall: null,
      search: null,
      status: null,
      connection: null,
      outcome: null,
      page: null,
      limit: null,
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle both camelCase and underscore formats
  const enterpriseId = urlParams.get('enterprise_id');
  const teamId = urlParams.get('team_id');
  const authKey = urlParams.get('auth_key');
  const tab = urlParams.get('tab');
  const callDetailsTab = urlParams.get('callDetailsTab');
  const selectedCall = urlParams.get('selectedCall');
  
  // Filter parameters
  const search = urlParams.get('search');
  const status = urlParams.get('status');
  const connection = urlParams.get('connection');
  const outcome = urlParams.get('outcome');
  const page = urlParams.get('page');
  const limit = urlParams.get('limit');
  
  return {
    enterprise_id: enterpriseId,
    team_id: teamId,
    auth_key: authKey,
    tab: tab,
    callDetailsTab: callDetailsTab,
    selectedCall: selectedCall,
    search: search,
    status: status,
    connection: connection,
    outcome: outcome,
    page: page,
    limit: limit,
  };
}

export function decodeAuthKey(authKey: string | null): Record<string, unknown> | null {
  if (!authKey) return null;
  
  try {
    // Remove "Bearer " prefix if present
    const cleanAuthKey = authKey.replace(/^Bearer\s+/, '');
    
    // Decode base64
    const decoded = atob(cleanAuthKey);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding auth key:', error);
    return null;
  }
}

export function buildUrlWithParams(basePath: string, additionalParams?: Record<string, string>): string {
  // During SSR, return base path to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return basePath;
  }
  
  const currentParams = extractUrlParams();
  const searchParams = new URLSearchParams();
  
  // Add enterprise_id and team_id if they exist
  if (currentParams.enterprise_id) {
    searchParams.set('enterprise_id', currentParams.enterprise_id);
  }
  if (currentParams.team_id) {
    searchParams.set('team_id', currentParams.team_id);
  }
  if (currentParams.auth_key) {
    searchParams.set('auth_key', currentParams.auth_key);
  }
  
  // Add any additional parameters
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
  }
  
  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

// Helper function to preserve state parameters when navigating
export function buildUrlWithState(basePath: string, stateParams?: { 
  tab?: string; 
  callDetailsTab?: string; 
  selectedCall?: string; 
}, additionalParams?: Record<string, string>): string {
  const mergedParams = { ...additionalParams };
  
  if (stateParams?.tab) {
    mergedParams.tab = stateParams.tab;
  }
  if (stateParams?.callDetailsTab) {
    mergedParams.callDetailsTab = stateParams.callDetailsTab;
  }
  if (stateParams?.selectedCall) {
    mergedParams.selectedCall = stateParams.selectedCall;
  }
  
  return buildUrlWithParams(basePath, mergedParams);
}

// Filter state interface for URL synchronization
export interface FilterState {
  search?: string;
  status?: string[];
  connection?: string[];
  outcome?: string;
  page?: number;
  limit?: number;
}

// Function to update filter parameters in URL
export function updateUrlWithFilters(basePath: string, filters: FilterState): void {
  if (typeof window === 'undefined') return;
  
  const currentParams = extractUrlParams();
  const searchParams = new URLSearchParams();
  
  // Preserve essential parameters
  if (currentParams.enterprise_id) {
    searchParams.set('enterprise_id', currentParams.enterprise_id);
  }
  if (currentParams.team_id) {
    searchParams.set('team_id', currentParams.team_id);
  }
  if (currentParams.auth_key) {
    searchParams.set('auth_key', currentParams.auth_key);
  }
  if (currentParams.tab) {
    searchParams.set('tab', currentParams.tab);
  }
  if (currentParams.callDetailsTab) {
    searchParams.set('callDetailsTab', currentParams.callDetailsTab);
  }
  if (currentParams.selectedCall) {
    searchParams.set('selectedCall', currentParams.selectedCall);
  }
  
  // Add filter parameters (only if they have meaningful values)
  if (filters.search && filters.search.trim()) {
    searchParams.set('search', filters.search.trim());
  }
  
  if (filters.status && filters.status.length > 0 && !filters.status.includes('all')) {
    searchParams.set('status', filters.status.join(','));
  }
  
  if (filters.connection && filters.connection.length > 0 && !filters.connection.includes('all')) {
    searchParams.set('connection', filters.connection.join(','));
  }
  
  if (filters.outcome && filters.outcome !== 'all') {
    searchParams.set('outcome', filters.outcome);
  }
  
  if (filters.page && filters.page > 1) {
    searchParams.set('page', filters.page.toString());
  }
  
  if (filters.limit && filters.limit !== 10) {
    searchParams.set('limit', filters.limit.toString());
  }
  
  const queryString = searchParams.toString();
  const newUrl = queryString ? `${basePath}?${queryString}` : basePath;
  
  // Update URL without triggering navigation
  window.history.replaceState({}, '', newUrl);
}

// Function to restore filter state from URL
export function restoreFiltersFromUrl(): FilterState {
  const params = extractUrlParams();
  
  return {
    search: params.search || '',
    status: params.status ? params.status.split(',') : ['all'],
    connection: params.connection ? params.connection.split(',') : ['all'],
    outcome: params.outcome || 'all',
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 10,
  };
}
