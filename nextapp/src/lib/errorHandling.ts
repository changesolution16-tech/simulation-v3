export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  userMessage?: string;
  recoverable: boolean;
}

export interface DatabaseError {
  message: string;
  code?: string;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;
  private static errorListeners: ((error: AppError) => void)[] = [];

  static handleError(
    error: unknown,
    context?: Record<string, any>,
    userMessage?: string
  ): AppError {
    const appError = this.createAppError(error, context, userMessage);
    this.logError(appError);
    this.notifyListeners(appError);

    if (appError.severity === 'critical') {
      console.error('Critical error occurred:', appError);
    }

    return appError;
  }

  private static createAppError(
    error: unknown,
    context?: Record<string, any>,
    userMessage?: string
  ): AppError {
    let message = 'An unexpected error occurred';
    let code: string | undefined;
    let severity: ErrorSeverity = 'error';
    let recoverable = true;

    if (error instanceof Error) {
      message = error.message;
      code = (error as any).code;
    } else if (typeof error === 'string') {
      message = error;
    } else if (this.isDatabaseError(error)) {
      message = error.message;
      code = error.code;
      severity = this.getDatabaseErrorSeverity(error);
      recoverable = this.isDatabaseErrorRecoverable(error);
      userMessage = userMessage || this.getDatabaseUserMessage(error);
    }

    return {
      message,
      code,
      severity,
      timestamp: new Date(),
      context,
      userMessage,
      recoverable
    };
  }

  private static isDatabaseError(error: unknown): error is DatabaseError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'code' in error
    );
  }

  private static getDatabaseErrorSeverity(error: DatabaseError): ErrorSeverity {
    if (error.code === 'PGRST301') return 'critical';
    if (error.code?.startsWith('42')) return 'error';
    if (error.code?.startsWith('23')) return 'warning';
    return 'error';
  }

  private static isDatabaseErrorRecoverable(error: DatabaseError): boolean {
    const unrecoverableCodes = ['PGRST301', '42501', '42P01'];
    return !unrecoverableCodes.includes(error.code || '');
  }

  private static getDatabaseUserMessage(error: DatabaseError): string {
    const code = error.code;

    if (code === 'PGRST116') {
      return 'The requested item was not found';
    }
    if (code === '23505') {
      return 'This item already exists';
    }
    if (code === '23503') {
      return 'Cannot delete this item as it is referenced by other items';
    }
    if (code === '42501') {
      return 'You do not have permission to perform this action';
    }
    if (code?.startsWith('22')) {
      return 'Invalid data format';
    }

    return 'A database error occurred. Please try again';
  }

  static handleNetworkError(error: unknown, context?: Record<string, any>): AppError {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const message = isOffline
      ? 'No internet connection detected'
      : 'Network request failed';

    const userMessage = isOffline
      ? 'Please check your internet connection and try again'
      : 'Unable to connect to the server. Please try again';

    return this.handleError(
      new Error(message),
      { ...context, isOffline },
      userMessage
    );
  }

  static handleVideoError(
    url: string,
    platform: string,
    error: unknown
  ): AppError {
    const context = { url, platform };
    const userMessage = 'Unable to load video. Please try again or use a different video';

    return this.handleError(error, context, userMessage);
  }

  static handleAuthError(error: unknown): AppError {
    const context = { type: 'authentication' };
    let userMessage = 'Authentication failed. Please try logging in again';

    if (error instanceof Error) {
      if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
        userMessage = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please confirm your email before logging in';
      } else if (error.message.includes('User not found')) {
        userMessage = 'No account found with this email';
      }
    }

    return this.handleError(error, context, userMessage);
  }

  static handleDataFetchError(
    resource: string,
    error: unknown
  ): AppError {
    const context = { resource, operation: 'fetch' };
    const userMessage = `Unable to load ${resource}. Please refresh the page`;

    return this.handleError(error, context, userMessage);
  }

  static handleDataSaveError(
    resource: string,
    error: unknown
  ): AppError {
    const context = { resource, operation: 'save' };
    const userMessage = `Unable to save ${resource}. Please try again`;

    return this.handleError(error, context, userMessage);
  }

  private static logError(error: AppError): void {
    this.errorLog.push(error);

    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    console.error(
      `[${error.severity.toUpperCase()}] ${error.message}`,
      error.context
    );
  }

  static getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  static clearErrorLog(): void {
    this.errorLog = [];
  }

  static addErrorListener(callback: (error: AppError) => void): () => void {
    this.errorListeners.push(callback);

    return () => {
      this.errorListeners = this.errorListeners.filter((cb) => cb !== callback);
    };
  }

  private static notifyListeners(error: AppError): void {
    this.errorListeners.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delayMs?: number;
      backoff?: boolean;
      onRetry?: (attempt: number, error: unknown) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoff = true,
      onRetry
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts) {
          const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

          if (onRetry) {
            onRetry(attempt, error);
          }

          console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  static createErrorToast(error: AppError): {
    message: string;
    type: 'error' | 'warning' | 'info';
    duration?: number;
  } {
    const message = error.userMessage || error.message;
    const type = error.severity === 'critical' || error.severity === 'error'
      ? 'error'
      : error.severity === 'warning'
      ? 'warning'
      : 'info';

    const duration = error.severity === 'critical' ? undefined : 5000;

    return { message, type, duration };
  }

  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('Failed to fetch')
      );
    }
    return false;
  }

  static isAuthError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('auth') ||
        error.message.includes('authentication') ||
        error.message.includes('unauthorized') ||
        error.message.includes('Invalid login')
      );
    }

    if (this.isDatabaseError(error)) {
      return error.code === '42501' || error.message.includes('permission');
    }

    return false;
  }

  static shouldRetry(error: unknown): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }

    if (this.isNetworkError(error)) {
      return true;
    }

    if (this.isDatabaseError(error)) {
      const recoverableCodes = ['PGRST301', '57014'];
      return recoverableCodes.includes(error.code || '');
    }

    return false;
  }
}

export default ErrorHandler;
