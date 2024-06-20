import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users, email_verification_token } from "@/db/schema";
import { setCookie } from "hono/cookie";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { lucia } from "@/lib/lucia";
import { isWithinExpirationDate } from "oslo";

const querySchema = z.object({
  code: z.string(),
});

const app = new OpenAPIHono().openapi(
  createRoute({
    method: "post",
    path: "/api/auth/verify-email",
    tags: ["Auth"],
    summary: "Verify a user's email using a verification code",
    request: {
      query: querySchema.openapi({
        example: {
          code: "",
        },
      }),
    },
    responses: {
      200: {
        description: "Email verified successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Email verified successfully",
                },
              }),
          },
        },
      },
      400: {
        description: "Unauthorized to verify this email",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Unauthorized to verify this email",
                },
              }),
          },
        },
      },
      500: {
        description: "Failed to verify email",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Failed to verify email",
                },
              }),
          },
        },
      },
    },
  }),
  async (c) => {
    // Extract the cookie from context
    const { code } = c.req.valid("query");

    // Start a database transaction
    await db.transaction(async (tx) => {
      try {
        // Query the token with the code provided
        const token = await tx.query.email_verification_token.findFirst({
          where: eq(email_verification_token.code, code),
        });

        // Check if the token is valid
        if (!token || isWithinExpirationDate(token.expiresAt)) {
          return c.json({ message: "Unauthorized to verify this email" }, 400);
        }

        // Query the user with user id
        const user = await tx.query.users.findFirst({
          where: eq(users.id, token.user_id),
        });

        // Check if the user exists and token is associated with the user
        if (!user || user.email !== token.email) {
          return c.json({ message: "Unauthorized to verify this email" }, 400);
        }

        // Invalidate the user session
        await lucia.invalidateUserSessions(user.id);

        // Update the email verification status
        await tx
          .update(users)
          .set({ emailVerified: true })
          .where(eq(users.id, token.user_id));

        // Delete the token
        await tx
          .delete(email_verification_token)
          .where(eq(email_verification_token.code, code));

        // Instantiate a new cookie session
        const session = await lucia.createSession(user.id, {});

        // Create a new cookie session
        const sessionCookie = lucia.createSessionCookie(session.id);

        // Set the session in cookie
        setCookie(
          c,
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      } catch (error) {
        return c.json({ message: "Failed to verify email" }, 500);
      }
    });

    return c.json({ message: "Email verified successfully" }, 200);
  }
);

export default app;
