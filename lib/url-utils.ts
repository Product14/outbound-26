export interface UrlParams {
  enterprise_id: string | null;
  team_id: string | null;
  auth_key: string | null;
  tab: string | null;
  callDetailsTab: string | null;
  selectedCall: string | null;
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
  
  return {
    enterprise_id: enterpriseId,
    team_id: teamId,
    auth_key: authKey,
    tab: tab,
    callDetailsTab: callDetailsTab,
    selectedCall: selectedCall,
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
