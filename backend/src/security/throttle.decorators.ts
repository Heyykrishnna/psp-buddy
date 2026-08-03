import { SetMetadata } from '@nestjs/common';

/**
 * Override the default throttler limit for a specific route.
 * Usage: @Throttle({ default: { limit: 20, ttl: 60000 } })
 */
export { Throttle, SkipThrottle } from '@nestjs/throttler';
