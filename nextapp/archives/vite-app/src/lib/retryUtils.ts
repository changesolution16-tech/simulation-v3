export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
    'Failed to fetch',
    'NetworkError',
    'Network request failed'
  ]
};

function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;

  const errorMessage = error.message || String(error);
  const errorCode = error.code || '';

  return retryableErrors.some(retryable =>
    errorMessage.includes(retryable) ||
    errorCode.includes(retryable)
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let currentDelay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxRetries) {
        break;
      }

      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error;
      }

      console.warn(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after error:`,
        error instanceof Error ? error.message : String(error),
        `Waiting ${currentDelay}ms before retry...`
      );

      await delay(currentDelay);
      currentDelay = Math.min(currentDelay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        try {
          await fn();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.processing = false;
  }

  clear() {
    this.queue = [];
  }

  get length() {
    return this.queue.length;
  }
}
