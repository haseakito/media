import { db } from "@/db";
import { eq } from "drizzle-orm";
import { insertUserSchema, users } from "@/db/schema";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ContextVariables } from "@/server/types";
import { authMiddleware } from "@/server/middlewares/auth";

const updateUserSchema = insertUserSchema.omit({
  id: true,
  email: true,
  emailVerified: true,
  password: true,
  createdAt: true,
  updatedAt: true,
});

const app = new OpenAPIHono<{ Variables: ContextVariables }>().openapi(
  createRoute({
    method: "patch",
    path: "/api/users/:userId",
    tags: ["Users"],
    summary: "Update user information",
    middleware: authMiddleware,
    request: {
      params: z.object({
        userId: z.string().min(1),
      }),
      body: {
        description: "",
        content: {
          "application/json": {
            schema: updateUserSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update user information successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Update user information successfully",
                },
              }),
          },
        },
      },
      400: {
        description: "Unauthorized to perform this action",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Unauthorized to perform this action",
                },
              }),
          },
        },
      },
      500: {
        description: "Failed to update user information",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Failed to update user information",
                },
              }),
          },
        },
      },
    },
  }),
  async (c) => {
    // Extract validated data from the request
    const { userId } = c.req.valid("param");
    const data = c.req.valid("json");

    // Extract session from the context
    const session = c.get("session");

    // Extract user from the context
    const user = c.get("user")!;

    // Check if the session is valid and the user has the necessary permission
    if (!session || (session.userId !== userId && user.role !== "ADMIN")) {
      return c.json({ message: "Unauthorized to perform this action" }, 400);
    }

    try {
      // Update user fields
      await db
        .update(users)
        .set({
          name: data.name,
          username: data.username,
          bio: data.bio,
          link: data.link,
          dob: data.dob,
          profileImage: data.profileImage,
          coverImage: data.coverImage,
        })
        .where(eq(users.id, userId));

      return c.json({ message: "Update user information successfully" }, 200);
    } catch (error) {
      return c.json({ message: "Failed to update user information" }, 500);
    }
  }
);

export default app;
