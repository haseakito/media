import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { lucia } from "@/lib/lucia";
import { cookies } from "next/headers";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const app = new OpenAPIHono().openapi(
  createRoute({
    method: "post",
    path: "/api/auth/login",
    tags: ["Auth"],
    summary: "Log in a user",
    request: {
      body: {
        description: "The user credentials for login",
        content: {
          "application/json": {
            schema: loginSchema.openapi("LoginRequest", {
              example: {
                email: "example@example.com",
                password: "examplePassword",
              },
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Signed in successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Signed in successfully",
                },
              }),
          },
        },
      },
      401: {
        description: "Invalid email or password",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Invalid email or password",
                },
              }),
          },
        },
      },
      500: {
        description: "Failed to sign in",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Failed to sign in",
                },
              }),
          },
        },
      },
    },
  }),
  async (c) => {
    // Extract validated data from the request
    const { email, password } = c.req.valid("json");

    try {
      // Query the user with email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Check if the user exists
      if (!user) {
        return c.json({ message: "Invalid email or password" }, 401);
      }

      // Verify the password
      const passwordMatch = await Bun.password.verify(password, user.password);
      if (!passwordMatch) {
        return c.json({ message: "Invalid email or password" }, 401);
      }

      // Instantiate a new cookie session
      const session = await lucia.createSession(user.id, {});

      // Create a new cookie session
      const sessionCookie = lucia.createSessionCookie(session.id);

      // Set the session in cookie
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );

      return c.json({ message: "Signed in successfully" }, 200);
    } catch (error) {
      return c.json({ message: "Failed to sign in" }, 500);
    }
  }
);

export default app;
