import { hc } from "hono/client";

import { AppType } from "@/server";

// Initialize the Hono client
export const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);
