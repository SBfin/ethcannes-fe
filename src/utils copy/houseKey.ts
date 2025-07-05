/**
 * House private key management utility
 * WARNING: This should only be used in API routes (server-side), never in client-side code
 */

export const getHousePrivateKey = (): string => {
  // Use backend-only environment variable (no NEXT_PUBLIC_ prefix)
  const privateKey = process.env.HOUSE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('HOUSE_PRIVATE_KEY not found in environment variables. Make sure it\'s set in .env.local');
  }
  
  // Security check - make sure this is running server-side
  if (typeof window !== 'undefined') {
    throw new Error('getHousePrivateKey() should only be called from API routes, not client-side code!');
  }
  
  // Basic validation - should be 64 hex characters (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error('Invalid private key format. Should be 64 hex characters.');
  }
  
  return privateKey;
};

export const validateHousePrivateKey = (): boolean => {
  try {
    getHousePrivateKey();
    return true;
  } catch {
    return false;
  }
}; 