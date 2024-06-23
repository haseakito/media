import { db } from "@/db";
import { eq } from "drizzle-orm";
import { selectUserSchema, users } from "@/db/schema";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { cacheMiddleware } from "@/server/middlewares/cache";

const app = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/api/users",
      tags: ["Users"],
      summary: "Get a number of users",
      middleware: cacheMiddleware,
      request: {
        query: z.object({
          limit: z.string().default("10"),
          offset: z.string().default("0"),
        }),
      },
      responses: {
        200: {
          description: "Fetched users successfully",
          content: {
            "application/json": {
              schema: z.object({
                data: selectUserSchema.omit({ password: true }).array(),
                message: z.string(),
              }),
            },
          },
        },
        500: {
          description: "Failed to fetch users",
          content: {
            "application/json": {
              schema: z
                .object({
                  message: z.string(),
                })
                .openapi({
                  example: {
                    message: "Failed to fetch users",
                  },
                }),
            },
          },
        },
      },
    }),
    async (c) => {
      // Extract validated data from the request
      const { limit, offset } = c.req.valid("query");

      try {
        // Query users with limit and offset
        // Omit the password to reduce security risks
        const users = await db.query.users.findMany({
          limit: parseInt(limit),
          offset: parseInt(offset),
          columns: {
            password: false,
          },
        });

        return c.json(
          { data: users, message: "Fetched users successfully" },
          200
        );
      } catch (error) {
        return c.json({ message: "Failed to fetch users" }, 500);
      }
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/api/users/:userId",
      tags: ["Users"],
      summary: "Get a specific user detail",
      middleware: cacheMiddleware,
      request: {
        params: z.object({
          userId: z.string(),
        }),
      },
      responses: {
        200: {
          description: "Fetched the user successfully",
          content: {
            "application/json": {
              schema: z.object({
                data: z.union([
                  selectUserSchema.omit({ password: true }),
                  z.undefined(),
                ]),
                message: z.string(),
              }),
            },
          },
        },
        500: {
          description: "Failed to fetch the user",
          content: {
            "application/json": {
              schema: z
                .object({
                  message: z.string(),
                })
                .openapi({
                  example: {
                    message: "Failed to fetch the user",
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

      try {
        // Query user with user id
        // Omit the password to reduce security risks
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            password: false,
          },
        });

        return c.json(
          { data: user, message: "Fetched the user successfully" },
          200
        );
      } catch (error) {
        return c.json({ message: "Failed to fetch the user" }, 500);
      }
    }
  );

export default app;
