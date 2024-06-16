import { cache } from "react";
import { cookies } from "next/headers";
import { Lucia, Session, TimeSpan, User } from "lucia";
import { Mysql2Adapter } from "@lucia-auth/adapter-mysql";
import { conn} from "@/db";

// 
declare module "lucia" {
  interface Register {
    Lucia: typeof Lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }

  interface DatabaseUserAttributes {
    id: string;
    email: string;
    email_verified: boolean;
    profile_image: string | null;
  }
}

// Initialize the adapter
const adapter = new Mysql2Adapter(conn, {
  user: "users",
  session: "sessions",
});

// Initialize lucia authentication
export const lucia = new Lucia(adapter, {
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      email: attributes.email,
      email_verified: attributes.email_verified,
      profile_image: attributes.profile_image,
    };
  },
  sessionExpiresIn: new TimeSpan(2, "w"),
  sessionCookie: {
    attributes: {
      secure: true,
      sameSite: "strict",
    },
  },
});

export const validateRequest = () =>
  cache(
    async (): Promise<
      { user: User; session: Session } | { user: null; session: null }
    > => {
      const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
      if (!sessionId) {
        return {
          user: null,
          session: null,
        };
      }

      const result = await lucia.validateSession(sessionId);
      // next.js throws when you attempt to set cookie when rendering page
      try {
        if (result.session && result.session.fresh) {
          const sessionCookie = lucia.createSessionCookie(result.session.id);
          cookies().set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );
        }
        if (!result.session) {
          const sessionCookie = lucia.createBlankSessionCookie();
          cookies().set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes
          );
        }
      } catch {}
      return result;
    }
  );
