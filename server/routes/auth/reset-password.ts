import { db } from "@/db";
import { users } from "@/db/schema";
import { generatePasswordResetToken } from "@/lib/lucia";
import { emailQueue } from "@/lib/queue";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

const resetPasswordSchema = z.object({
  email: z.string().email(),
});


const app = new OpenAPIHono().openapi(
  createRoute({
    method: "post",
    path: "/api/auth/reset-password",
    tags: ["Auth"],
    summary: "Reset the password using the password reset token",
    request: {
      body: {
        description: "Email address to send the password reset token to",
        content: {
          "application/json": {
            schema: resetPasswordSchema.openapi({
              example: {
                email: "example@example.com",
              },
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Sent password reset email successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Sent password reset email successfully",
                },
              }),
          },
        },
      },
      400: {
        description: "Invalid email address",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Invalid email address",
                },
              }),
          },
        },
      },
      500: {
        description: "Failed to send password reset email",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Failed to send password reset email",
                },
              }),
          },
        },
      },
    },
  }),
  async (c) => {
    // Extract validated data from the request
    const { email } = c.req.valid("json");

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user || !user.emailVerified) {
        return c.json({ message: "Invalid email address" }, 400);
      }

      // Generate a new password reset verification token
      const verificationToken = await generatePasswordResetToken({
        userId: user.id,
      });

      // Add seding email with verification token to queue
      await emailQueue.add("sendPasswordResetEmail", {
        name: user.name,
        email: email,
        verificationToken: verificationToken,
      });
      return c.json({ message: "Sent password reset email successfully" }, 200);
    } catch (error) {
      return c.json({ message: "Failed to send password reset email" }, 500);
    }
  }
);

export default app;
