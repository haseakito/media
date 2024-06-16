import { db } from "@/db";
import { users } from "@/db/schema";
import { emailQueue } from "@/lib/queue";
import { generateEmailVerificationCode } from "@/lib/lucia";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";

const registerSchema = z.object({
  name: z.string().min(1).max(30),
  email: z.string().email(),
  password: z.string().min(8),
});

const app = new OpenAPIHono().openapi(
  createRoute({
    method: "post",
    path: "/api/auth/signup",
    tags: ["Auth"],
    summary: "Register a new user and send email for verification",
    request: {
      body: {
        description: "",
        content: {
          "application/json": {
            schema: registerSchema.openapi("RegisterUser", {
              example: {
                name: "example",
                email: "example@example.com",
                password: "OyyhKWW7Uf",
              },
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "User created successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "User created successfully",
                },
              }),
          },
        },
      },
      500: {
        description: "Failed to create a new user",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Failed to create a new user",
                },
              }),
          },
        },
      },
    },
  }),
  async (c) => {
    // Extract validated data from the request
    const { name, email, password } = c.req.valid("json");

    // Hash password for security
    const hashedPassword = await Bun.password.hash(password);

    try {
      // Generate a new user id
      const userId = createId();

      // Insert a new user entity
      await db.insert(users).values({
        id: userId,
        name: name,
        email: email,
        password: hashedPassword,
      });

      // Generate a new email verification code
      const verificationCode = await generateEmailVerificationCode({
        userId: userId,
        email: email,
      });

      // Add seding email with verification code to queue
      await emailQueue.add("sendEmailVerification", {
        name: name,
        email: email,
        verificationCode: verificationCode,
      });

      return c.json({ message: "User created successfully" }, 201);
    } catch (error) {
      return c.json({ message: "Failed to create a new user" }, 500);
    }
  }
);

export default app;
