import { OpenAPIHono } from "@hono/zod-openapi";
import { csrf } from "hono/csrf";
import { getCookie } from "hono/cookie";
import { lucia } from "@/lib/lucia";
import type { User, Session } from "lucia";
import { authRoutes } from "./routes/auth";

// Instantiate a new Hono app
const app = new OpenAPIHono<{
  Variables: {
    user: User | null;
    session: Session | null;
  };
}>().basePath("/api");

// 
app.use(csrf());

app.use("*", async (c, next) => {
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    // use `header()` instead of `setCookie()` to avoid TS errors
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }
  if (!session) {
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
      append: true,
    });
  }
  c.set("user", user);
  c.set("session", session);
  return next();
});

// OpenAPI documentation
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "FaceIT Media",
    version: "1.0.0"    
  }
})

// API routes
const routes = app.route("/", authRoutes)

// Export types
export type AppType = typeof routes;

export { app };
