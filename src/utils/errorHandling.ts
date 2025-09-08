/**
 * Standardized error handling utilities
 */

export const ErrorType = {
  API_ERROR: 'API_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

export class ValoriesError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  constructor(
    type: ErrorType,
    message: string,
    statusCode?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ValoriesError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Handle API response errors consistently
 */
export function handleApiError(
  response: Response,
  errorText: string,
  context: string
): ValoriesError {
  const message = `${context} failed: ${response.status} - ${errorText}`;
  return new ValoriesError(ErrorType.API_ERROR, message, response.status);
}

/**
 * Handle parsing errors consistently
 */
export function handleParsingError(
  context: string,
  originalError?: Error
): ValoriesError {
  const message = `Failed to parse ${context}`;
  return new ValoriesError(ErrorType.PARSING_ERROR, message, undefined, originalError);
}

/**
 * Handle configuration errors consistently
 */
export function handleConfigError(message: string): ValoriesError {
  return new ValoriesError(ErrorType.CONFIG_ERROR, message);
}

/**
 * Handle network errors consistently
 */
export function handleNetworkError(
  context: string,
  originalError: Error
): ValoriesError {
  const message = `${context} - network error`;
  return new ValoriesError(ErrorType.NETWORK_ERROR, message, undefined, originalError);
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Log errors consistently
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.error(`[${context}] ❌ ${message}`);
  
  if (error instanceof Error && error.stack) {
    console.error(`[${context}] Stack trace:`, error.stack);
  }
}