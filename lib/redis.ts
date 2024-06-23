import { Redis } from "ioredis";

// Instantiate a new Redis client
const redis = new Redis(process.env.REDIS_HOST!, {
  maxRetriesPerRequest: null,
});

export default redis;
