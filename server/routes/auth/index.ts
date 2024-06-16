import { OpenAPIHono } from "@hono/zod-openapi";
import signup from "./register";
import login from "./login";
import verifyEmail from "./verify-email";

export const authRoutes = new OpenAPIHono()
  .route("/", signup)
  .route("/", login)
  .route("/", verifyEmail);
