import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a string to camel case
 * @param str - The string to convert
 * @returns The camel case string
 */
export function toCamelCase(str: string): string {
  // Handle all-caps single words (convert to lowercase)
  if (str === str.toUpperCase() && !str.includes('_') && !str.includes('-') && !str.includes(' ')) {
    return str.toLowerCase();
  }
  
  // Standard camelCase conversion
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
}

/**
 * Converts all keys in an object to camel case
 * @param obj - The object whose keys should be converted
 * @returns A new object with camel case keys
 */
export function convertKeysToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively convert nested object keys
      result[camelKey] = convertKeysToCamelCase(value);
    } else if (Array.isArray(value)) {
      // Handle arrays - convert keys of objects within arrays
      result[camelKey] = value.map(item => 
        item && typeof item === 'object' && !Array.isArray(item) 
          ? convertKeysToCamelCase(item) 
          : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  
  return result;
}

/**
 * Converts a string to proper case (first letter of each word capitalized)
 * @param str - The string to convert
 * @returns The proper case string
 */
export function toProperCase(str: string): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Get display name for customer
 * @param customer - Customer object with name fields
 * @returns Formatted display name
 */
export function getCustomerDisplayName(customer: any): string {
  if (!customer) return 'Unknown Customer';
  
  const firstName = customer.firstName || customer.first_name || '';
  const lastName = customer.lastName || customer.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  return firstName || lastName || customer.name || 'Unknown Customer';
}

/**
 * Get display phone number for customer
 * @param customer - Customer object with phone fields
 * @returns Formatted phone number
 */
export function getCustomerDisplayPhone(customer: any): string {
  if (!customer) return '';
  
  return customer.phoneNumber || customer.phone_number || customer.contactPhoneNumber || customer.phone || '';
}

/**
 * Get customer initials for avatar display
 * @param customer - Customer object with name fields
 * @returns Customer initials (2 letters)
 */
export function getCustomerInitials(customer: any): string {
  if (!customer) return 'UC';
  
  const firstName = customer.firstName || customer.first_name || '';
  const lastName = customer.lastName || customer.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  const name = firstName || lastName || customer.name || 'Unknown Customer';
  const words = name.split(' ').filter((word: string) => word.length > 0);
  
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
}

/**
 * Extract tenant IDs from referrer URL
 * @param referrer - The referrer URL string
 * @returns Object with enterprise_id and team_id
 */
export function getTenantIdsFromReferrer(referrer?: string): { enterprise_id: string | null; team_id: string | null } {
  if (!referrer) {
    return { enterprise_id: null, team_id: null };
  }
  
  try {
    const url = new URL(referrer);
    const params = new URLSearchParams(url.search);
    
    return {
      enterprise_id: params.get('enterprise_id'),
      team_id: params.get('team_id')
    };
  } catch (error) {
    console.error('Error parsing referrer URL:', error);
    return { enterprise_id: null, team_id: null };
  }
}
