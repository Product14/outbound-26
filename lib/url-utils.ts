export interface UrlParams {
  enterprise_id: string | null;
  team_id: string | null;
  auth_key: string | null;
}

export function extractUrlParams(): UrlParams {
  if (typeof window === 'undefined') {
    return {
      enterprise_id: null,
      team_id: null,
      auth_key: null,
    };
  }

  const urlParams = new URLSearchParams(window.location.search);

  console.log(urlParams.get('auth_key'))
  
  // Handle both camelCase and underscore formats
  const enterpriseId = urlParams.get('enterprise_id');
  const teamId = urlParams.get('team_id');
  const authKey = urlParams.get('auth_key');
  
  return {
    enterprise_id: enterpriseId,
    team_id: teamId,
    auth_key: authKey,
  };
}

export function decodeAuthKey(authKey: string | null): any {
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
