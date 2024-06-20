import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { accounts, users } from "@/db/schema";
import { lucia } from "@/lib/lucia";
import { github, google } from "@/lib/oauth2";
import { generateCodeVerifier, generateState } from "arctic";
import { getCookie, setCookie } from "hono/cookie";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginWithOAuth2Schema = z
  .object({
    message: z.string(),
    redirect_url: z.string().url(),
  })
  .openapi({
    example: {
      message: "Signed in successfully",
      redirect_url: "",
    },
  });

const OAuth2CallbackSchema = z.object({
  state: z.string().min(1),
  code: z.string().min(1),
});

const app = new OpenAPIHono()
  .openapi(
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
        if (!user || !user.password) {
          return c.json({ message: "Invalid email or password" }, 401);
        }

        // Verify the password
        const passwordMatch = await Bun.password.verify(
          password,
          user.password
        );
        if (!passwordMatch) {
          return c.json({ message: "Invalid email or password" }, 401);
        }

        // Instantiate a new cookie session
        const session = await lucia.createSession(user.id, {});

        // Create a new cookie session
        const sessionCookie = lucia.createSessionCookie(session.id);

        // Set the session in cookie
        setCookie(
          c,
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );

        return c.json({ message: "Signed in successfully" }, 200);
      } catch (error) {
        return c.json({ message: "Failed to sign in" }, 500);
      }
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/api/auth/login/github",
      tags: ["Auth"],
      summary: "Log in a user with GitHub",
      responses: {
        200: {
          description: "Signed in successfully",
          content: {
            "application/json": {
              schema: loginWithOAuth2Schema,
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
      try {
        // Create a state
        const state = generateState();

        // Create a redirect url with state
        const url = await github.createAuthorizationURL(state);

        // Set the temporary session in cookie
        setCookie(c, "github_oauth_state", state, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 60 * 10, // 10 minutes
          sameSite: "lax",
        });

        return c.json(
          { message: "Redirect to GitHub Successfully", redirect_url: url },
          200
        );
      } catch (error) {
        return c.json({ message: "Failed to sign in" }, 500);
      }
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/api/auth/login/github/callback",
      tags: ["Auth"],
      summary: "Callback API for GitHub OAuth2",
      request: {
        params: OAuth2CallbackSchema,
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
        400: {
          description: "Invalid state",
          content: {
            "application/json": {
              schema: z
                .object({
                  message: z.string(),
                })
                .openapi({
                  example: {
                    message: "Invalid state",
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
      const { state, code } = c.req.valid("param");

      // Extract the state stored in the cookie
      const storedState = getCookie(c, "github_oauth_state");

      // Check if the state from the request matches the state in the cookie
      if (!storedState || state !== storedState) {
        return c.json({ message: "Invalid state" }, 400);
      }

      try {
        // Validate the code
        const tokens = await github.validateAuthorizationCode(code);

        // Fetch the authenticated GitHub user
        const githubUserResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        // Parse the GitHub user data
        const githubUserResult = await githubUserResponse.json();

        // Query the account with oauth2 provider id and provider account id
        const existingAccount = await db.query.accounts.findFirst({
          where: and(
            eq(accounts.providerId, "github"),
            eq(accounts.providerAccountId, githubUserResult.node_id)
          ),
        });

        // Check if an account already exists
        if (existingAccount) {
          // Instantiate a new cookie session
          const session = await lucia.createSession(
            existingAccount.user_id,
            {}
          );

          // Create a new cookie session
          const sessionCookie = lucia.createSessionCookie(session.id);

          // Set the session in cookie
          setCookie(
            c,
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );

          return c.json({ message: "Signed in successfully" }, 200);
        }

        // Generate a new user id
        const userId = createId();

        // Start transaction
        db.transaction(async (tx) => {
          // Insert a new user entity
          tx.insert(users).values({
            id: userId,
            name: githubUserResult.name,
            username: githubUserResult.login,
            email: githubUserResult.email,
            profileImage: githubUserResult.avatar_url,
          });

          // Insert a new account entity
          tx.insert(accounts).values({
            providerId: "github",
            providerAccountId: githubUserResult.node_id,
            user_id: userId,
          });
        });

        // Instantiate a new cookie session
        const session = await lucia.createSession(userId, {});

        // Create a new cookie session
        const sessionCookie = lucia.createSessionCookie(session.id);

        // Set the session in cookie
        setCookie(
          c,
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );

        return c.json({ message: "Signed in successfully" }, 200);
      } catch (error) {
        return c.json({ message: "Failed to sign in" }, 500);
      }
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/api/auth/login/google",
      tags: ["Auth"],
      summary: "Log in a user with Google",
      responses: {
        200: {
          description: "Signed in successfully",
          content: {
            "application/json": {
              schema: loginWithOAuth2Schema,
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
      try {
        // Create a state
        const state = generateState();

        // Create a code verifier
        const codeVerifier = generateCodeVerifier();

        // Create a redirect url with state
        const url = await google.createAuthorizationURL(state, codeVerifier);

        // Set the temporary session in cookie
        setCookie(c, "state", state, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 60 * 10, // 10 minutes
          sameSite: "lax",
        });

        // Set the temporary session in cookie
        setCookie(c, "code_verifier", codeVerifier, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 60 * 10, // 10 minutes
          sameSite: "lax",
        });

        return c.json(
          { message: "Redirect to GitHub Successfully", redirect_url: url },
          200
        );
      } catch (error) {
        return c.json({ message: "Failed to sign in" }, 500);
      }
    }
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/api/auth/login/google/callback",
      tags: ["Auth"],
      summary: "Callback API for GitHub OAuth2",
      request: {
        params: OAuth2CallbackSchema,
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
        400: {
          description: "Invalid state",
          content: {
            "application/json": {
              schema: z
                .object({
                  message: z.string(),
                })
                .openapi({
                  example: {
                    message: "Invalid state",
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
      const { state, code } = c.req.valid("param");

      // Extract the state and code verifier stored in the cookie
      const storedState = getCookie(c, "state");
      const storedCodeVerifier = getCookie(c, "code_verifier");

      // Check if the state from the request matches the state in the cookie
      if (!storedState || !storedCodeVerifier || state !== storedState) {
        return c.json({ message: "Invalid state" }, 400);
      }

      try {
        // Validate the code
        const tokens = await google.validateAuthorizationCode(
          code,
          storedCodeVerifier
        );

        // Fetch the authenticated Google user info
        const googleUserResponse = await fetch(
          "https://www.googleapis.com/oauth2/v1/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        // Parse the Google user data
        const googleUserResult = await googleUserResponse.json();

        // Query the account with oauth2 provider id and provider account id
        const existingAccount = await db.query.accounts.findFirst({
          where: and(
            eq(accounts.providerId, "google"),
            eq(accounts.providerAccountId, googleUserResult.id)
          ),
        });

        // Check if an account already exists
        if (existingAccount) {
          // Instantiate a new cookie session
          const session = await lucia.createSession(
            existingAccount.user_id,
            {}
          );

          // Create a new cookie session
          const sessionCookie = lucia.createSessionCookie(session.id);

          // Set the session in cookie
          setCookie(
            c,
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );

          return c.json({ message: "Signed in successfully" }, 200);
        }

        // Generate a new user id
        const userId = createId();

        // Start transaction
        db.transaction(async (tx) => {
          // Insert a new user entity
          tx.insert(users).values({
            id: userId,
            name: googleUserResult.name,
            email: googleUserResult.email,
            profileImage: googleUserResult.picture,
          });

          // Insert a new account entity
          tx.insert(accounts).values({
            providerId: "google",
            providerAccountId: googleUserResult.id,
            user_id: userId,
          });
        });

        // Instantiate a new cookie session
        const session = await lucia.createSession(userId, {});

        // Create a new cookie session
        const sessionCookie = lucia.createSessionCookie(session.id);

        // Set the session in cookie
        setCookie(
          c,
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
