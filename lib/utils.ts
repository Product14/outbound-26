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
