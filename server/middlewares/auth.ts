import { createMiddleware } from "hono/factory";
import { ContextVariables } from "@/server/types";

export const authMiddleware = createMiddleware<{ Variables: ContextVariables }>(
  async (c, next) => {
    // Extract user from the context
    const user = c.get("user");

    // If there is no user, set the response status to 401 and return null
    if (!user) {
      return c.body(null, 401);
    }

    // Proceed to next middleware or handler if the user is present
    return next();
  }
);
