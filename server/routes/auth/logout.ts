import { lucia } from "@/lib/lucia";
import { getCookie, setCookie } from "hono/cookie";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/api/auth/login",
    tags: ["Auth"],
    summary: "Log out a user",
    responses: {
      200: {
        description: "Successful logout",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Log out successfully",
                },
              }),
          },
        },
      },
      400: {
        description: "Invalid request, session ID missing",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Invalid request",
                },
              }),
          },
        },
      },
    },
  }),
  async (c) => {
    // Extract the cookie from context
    const sessionId = getCookie(c, lucia.sessionCookieName);

    if (!sessionId) {
      return c.json({ message: "Invalid request" }, 400);
    }

    // Invalidate the session
    await lucia.invalidateSession(sessionId);

    // Create a new blank cookie session
    const sessionCookie = lucia.createBlankSessionCookie();

    // Set the session in cookie
    setCookie(
      c,
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return c.json({ message: "Log out successfully" }, 200);
  }
);

export default app;
