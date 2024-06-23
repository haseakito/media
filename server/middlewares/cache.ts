import { createMiddleware } from "hono/factory";
import zlib from "zlib";
import redis from "@/lib/redis";

const generateHash = (url: string) => {
  // Instantiate a new hasher
  const hasher = new Bun.CryptoHasher("sha1");

  return hasher.update(url).digest("hex");
};

export const cacheMiddleware = createMiddleware(async (c, next) => {
  // Generate the cache key by hashing the request url
  const key = generateHash(c.req.url);

  // Extract the cached value from Redis
  const cachedValue = await redis.get(key);

  // If cache hit, return it as a JSON response
  if (cachedValue) {
    try {
      // Decompress the cached value
      const decompressedBody = zlib
        .inflateSync(Buffer.from(cachedValue, "base64"))
        .toString();

      return c.json(JSON.parse(decompressedBody), 200);
    } catch (error) {
      console.error("Decompression error: ", error);
    }
  }

  // Proceed to next middleware
  await next();

  // Create a clone of the response to capture it without affecting the original
  const originalResult = c.res.clone();

  // If the response status is 200 (OK), cache the response body
  if (c.res.status === 200) {
    // Get the response body as a JSON object
    const resBody = await originalResult.json();

    // Serialize the response body to a JSON string
    const serializedBody = JSON.stringify(resBody);

    // Compress the serialized response body
    const compressedBody = zlib.deflateSync(serializedBody).toString("base64");

    // Store the cache
    await redis.set(key, compressedBody, "EX", 3600);
  }
});
