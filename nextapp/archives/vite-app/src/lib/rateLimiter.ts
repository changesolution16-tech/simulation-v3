interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      rateLimitStore.delete(key);
    } else if (now - entry.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: number;
} {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - 1,
    };
  }

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.blockedUntil,
    };
  }

  if (now - entry.firstAttempt > RATE_LIMIT_CONFIG.windowMs) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - 1,
    };
  }

  entry.attempts++;

  if (entry.attempts > RATE_LIMIT_CONFIG.maxAttempts) {
    entry.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.blockedUntil,
    };
  }

  return {
    allowed: true,
    remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - entry.attempts,
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

export function getRateLimitStatus(identifier: string): {
  isBlocked: boolean;
  attempts: number;
  resetTime?: number;
} {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry) {
    return { isBlocked: false, attempts: 0 };
  }

  const isBlocked = !!(entry.blockedUntil && entry.blockedUntil > now);

  return {
    isBlocked,
    attempts: entry.attempts,
    resetTime: entry.blockedUntil,
  };
}

export function formatResetTime(resetTime: number): string {
  const now = Date.now();
  const remainingMs = resetTime - now;

  if (remainingMs <= 0) return 'now';

  const minutes = Math.ceil(remainingMs / 60000);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
