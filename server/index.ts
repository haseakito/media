import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { csrf } from "hono/csrf";
import { getCookie, setCookie } from "hono/cookie";
import { lucia } from "@/lib/lucia";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { ContextVariables } from "./types";

// Instantiate a new Hono app
const app = new OpenAPIHono<{
  Variables: ContextVariables;
}>();

// Set up logger middleware
app.use(logger());

// Set up CSRF protection middleware
app.use(csrf());

// Set up Lucia authentication middleware
app.use(async (c, next) => {
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;

  // If there is no session, set user and session to null
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  // Validate the session
  const { user, session } = await lucia.validateSession(sessionId);

  // Check if the session is valid and fresh
  if (session && session.fresh) {
    // Create a new session cookie
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set the session in the cookie
    setCookie(c, lucia.sessionCookieName, sessionCookie.serialize(), {
      ...sessionCookie.attributes,
    });
  }

  // If the session is invalid, create a blank session and set it in the cookie
  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    setCookie(c, lucia.sessionCookieName, sessionCookie.serialize(), {
      ...sessionCookie.attributes,
    });
  }

  // Set user and session in context
  c.set("user", user);
  c.set("session", session);

  return next();
});

// OpenAPI documentation
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "FoodFor...",
    version: "1.0.0",
  },
});

// API routes
const routes = app.route("/", authRoutes).route("/", userRoutes);

// Export types
export type AppType = typeof routes;

export { app };
