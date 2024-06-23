import { OpenAPIHono } from "@hono/zod-openapi";
import getUser from "./get";
import updateUser from "./update";
import deleteUser from "./delete";

export const userRoutes = new OpenAPIHono()
  .route("/", getUser)
  .route("/", updateUser)
  .route("/", deleteUser);
