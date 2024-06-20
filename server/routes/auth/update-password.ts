import { db } from "@/db";
import { eq } from "drizzle-orm";
import { password_reset_token, users } from "@/db/schema";
import { setCookie } from "hono/cookie";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { hashToken, lucia } from "@/lib/lucia";
import { isWithinExpirationDate } from "oslo";

const paramSchema = z.object({
  tokenId: z.string(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8),
});

const app = new OpenAPIHono().openapi(
  createRoute({
    method: "post",
    path: "/api/auth/reset-password/:token",
    tags: ["Auth"],
    summary: "Reset the password using the password reset token",
    request: {
      params: paramSchema.openapi({
        example: {
          tokenId: "",
        },
      }),
      body: {
        description: "",
        content: {
          "application/json": {
            schema: updatePasswordSchema.openapi({
              example: {
                password: "OyyhKWW7Uf",
              },
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Password update successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Password update successfully",
                },
              }),
          },
        },
      },
      400: {
        description: "Unauthorized to reset password",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Unauthorized to reset password",
                },
              }),
          },
        },
      },
      500: {
        description: "Failed to update password",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Failed to update password",
                },
              }),
          },
        },
      },
    },
  }),
  async (c) => {
    // Extract validated data from the request
    const { tokenId } = c.req.valid("param");
    const { password } = c.req.valid("json");

    try {
      // Hash the token
      const tokenHash = await hashToken(tokenId);

      // Query the token with the token provided
      const token = await db.query.password_reset_token.findFirst({
        where: eq(password_reset_token.token, tokenHash),
      });

      // Check if the token is valid
      if (!token || !isWithinExpirationDate(token.expiresAt)) {
        return c.json({ message: "Unauthorized to reset password" }, 400);
      }

      // Invalidate the user session
      await lucia.invalidateUserSessions(token.user_id);

      // Hash password for security
      const hashedPassword = await Bun.password.hash(password);

      // Update the password
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, token.user_id));

      // Instantiate a new cookie session
      const session = await lucia.createSession(token.user_id, {});

      // Create a new cookie session
      const sessionCookie = lucia.createSessionCookie(session.id);

      // Set the session in cookie
      setCookie(
        c,
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );

      return c.json({ message: "Password update successfully" }, 200);
    } catch (error) {
      return c.json({ message: "Failed to update password" }, 500);
    }
  }
);

export default app;
