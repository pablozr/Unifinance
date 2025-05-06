import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Function to create Redis client safely
function createRedisClient() {
  // Check if Redis environment variables are set
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      return Redis.fromEnv();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
    }
  }

  // Return null if Redis is not configured
  console.warn('Redis environment variables not set. Rate limiting will be disabled.');
  return null;
}

// Create Redis client
const redis = createRedisClient();

// Create a new ratelimiter that allows 5 requests per minute for login
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:login',
    })
  : null;

// Create a new ratelimiter that allows 20 requests per minute for API endpoints
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:api',
    })
  : null;

// Helper function to get client IP
export function getClientIp(request: Request): string {
  // Get IP from headers (if behind a proxy)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to a default IP if we can't determine the real one
  return '127.0.0.1';
}

// Helper function to check rate limit
export async function checkRateLimit(
  request: Request,
  limiter: Ratelimit | null = loginRateLimiter
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    // If rate limiting is disabled (no Redis connection), always allow the request
    if (!limiter) {
      console.warn('Rate limiting is disabled. Request allowed.');
      return { success: true, limit: 0, remaining: 0, reset: 0 };
    }

    // Get client IP
    const ip = getClientIp(request);

    // Check rate limit
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    return { success, limit, remaining, reset };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // If rate limiting fails, allow the request to proceed
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}
