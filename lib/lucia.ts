import { cache } from "react";
import { cookies } from "next/headers";
import { Lucia, Session, TimeSpan, User } from "lucia";
import { Mysql2Adapter } from "@lucia-auth/adapter-mysql";
import { conn, db } from "@/db";
import { eq } from "drizzle-orm";
import { email_verification_token } from "@/db/schema";
import { createDate } from "oslo";
import { alphabet, generateRandomString } from "oslo/crypto";


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

interface generateEmailVerificationCodeProps {
  userId: string;
  email: string;
}

export const generateEmailVerificationCode = async ({
  userId,
  email,
}: generateEmailVerificationCodeProps): Promise<string> => {
  // Delete the all previous email verification token
  await db
    .delete(email_verification_token)
    .where(eq(email_verification_token.user_id, userId));

  // Generate a new email verification code
  const code = generateRandomString(8, alphabet("0-9", "A-Z"));

  // Insert a new email verification token record
  await db.insert(email_verification_token).values({
    user_id: userId,
    email: email,
    code: code,
    expiresAt: createDate(new TimeSpan(3, "h")),
  });

  return code;
};
