/**
 * Extended Error interface with additional properties for better error handling
 */
export interface AppError extends Error {
  code?: string;
  details?: unknown;
  originalError?: unknown;
}

/**
 * Create an AppError from any error type
 * @param error Original error
 * @param code Optional error code
 * @param details Optional additional details
 * @returns AppError instance
 */
export function createAppError(error: unknown, code?: string, details?: unknown): AppError {
  if (error instanceof Error) {
    const appError: AppError = error;
    if (code) appError.code = code;
    if (details) appError.details = details;
    return appError;
  }
  
  // If it's not an Error instance, create a new Error
  const appError: AppError = new Error(typeof error === 'string' ? error : 'Unknown error');
  appError.originalError = error;
  if (code) appError.code = code;
  if (details) appError.details = details;
  
  return appError;
}
