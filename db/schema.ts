import {
  mysqlTable,
  primaryKey,
  index,
  varchar,
  text,
  bigint,
  boolean,
  date,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createId } from "@paralleldrive/cuid2";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 30 }).notNull(),
    username: varchar("username", { length: 30 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    password: varchar("password", { length: 255 }),
    bio: text("bio"),
    link: varchar("link", { length: 255 }),
    dob: date("dob"),
    profileImage: varchar("profile_image", { length: 255 }),
    coverImage: varchar("cover_image", { length: 255 }),
    role: mysqlEnum("role", ["ADMIN", "USER"]).notNull().default("USER"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
  },
  (table) => {
    return {
      emailIdx: index("email_idx").on(table.email),
    };
  }
);

export const accounts = mysqlTable(
  "accounts",
  {
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    user_id: varchar("user_id", { length: 255 })
      .references(() => users.id)
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.providerId, table.providerAccountId] }),
      providerAccountIdIdx: index("provider_account_id_idx").on(
        table.providerAccountId
      ),
      userIdIdx: index("user_id_idx").on(table.user_id),
    };
  }
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 127 }).primaryKey(),
    user_id: varchar("user_id", { length: 255 })
      .references(() => users.id)
      .notNull(),
    activeExpires: bigint("active_expires", {
      mode: "number",
    }).notNull(),
    idleExpires: bigint("idle_expires", {
      mode: "number",
    }).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("user_id_idx").on(table.user_id),
    };
  }
);

export const email_verification_token = mysqlTable(
  "email_verification_tokens",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => createId()),
    code: varchar("code", { length: 8 }).notNull(),
    user_id: varchar("user_id", { length: 255 })
      .references(() => users.id)
      .notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("user_id_idx").on(table.user_id),
      emailIdx: index("email_idx").on(table.email),
    };
  }
);

export const password_reset_token = mysqlTable(
  "password_reset_tokens",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => createId()),
    token: varchar("token", { length: 40 }).notNull().unique(),
    user_id: varchar("user_id", { length: 255 })
      .references(() => users.id)
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => {
    return {
      userIdIdx: index("user_id_idx").on(table.user_id),
    };
  }
);

// Export schemas
export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);
