import { OpenAPIHono } from "@hono/zod-openapi";
import signup from "./register";
import login from "./login";
import logout from "./logout";
import verifyEmail from "./verify-email";
import resetPassword from "./reset-password";
import updatePassword from "./update-password";

export const authRoutes = new OpenAPIHono()
  .route("/", signup)
  .route("/", login)
  .route("/", verifyEmail)
  .route("/", resetPassword)
  .route("/", updatePassword)
  .route("/", logout);
