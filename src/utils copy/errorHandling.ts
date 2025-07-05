// Helper function to detect if error is from user rejection
export const isUserRejectedError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';
  
  return (
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user denied') ||
    errorMessage.includes('transaction was rejected') ||
    errorMessage.includes('user cancelled') ||
    errorMessage.includes('rejected by user') ||
    errorName.includes('userrejectedrequesterror') ||
    error.code === 4001 || // Standard error code for user rejection
    error.code === 'ACTION_REJECTED'
  );
};

// Process error to show user-friendly message
export const processTransactionError = (error: any): Error | null => {
  if (!error) return null;
  
  return isUserRejectedError(error) ? 
    new Error('User rejected the request') : 
    error;
};

// Get user-friendly error message
export const getErrorMessage = (error: any): string => {
  if (!error) return '';
  
  return isUserRejectedError(error) ? 
    'User rejected the request' : 
    error.message || 'An unexpected error occurred';
}; 