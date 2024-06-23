import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ContextVariables } from "@/server/types";
import { authMiddleware } from "@/server/middlewares/auth";

const app = new OpenAPIHono<{ Variables: ContextVariables }>().openapi(
  createRoute({
    method: "delete",
    path: "/api/users/:userId",
    tags: ["Users"],
    summary: "Delete user",
    middleware: authMiddleware,
    request: {
      params: z.object({
        userId: z.string().min(1),
      }),
    },
    responses: {
      200: {
        description: "Delete the user successfully",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Delete the user successfully",
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
        description: "Failed to delete the user",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
              })
              .openapi({
                example: {
                  message: "Failed to delete the user",
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

    // Extract session from the context
    const session = c.get("session");

    // Extract user from the context
    const user = c.get("user")!;

    // Check if the session is valid and the user has the necessary permission
    if (!session || (session.userId !== userId && user.role !== "ADMIN")) {
      return c.json({ message: "Unauthorized to perform this action" }, 400);
    }

    try {
      // Delete the user
      await db.delete(users).where(eq(users.id, userId));

      return c.json({ message: "Deleted user successfully" }, 200);
    } catch (error) {
      return c.json({ message: "Failed to delete user" }, 500);
    }
  }
);

export default app;
