import {
  mysqlTable,
  varchar,
  text,
  bigint,
  boolean,
  date,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    password: varchar("password", { length: 255 }).notNull(),
    bio: text("bio"),
    link: varchar("link", { length: 255 }),
    dob: date("dob"),
    profileImage: varchar("profile_image", { length: 255 }),
    coverImage: varchar("cover_image", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
  },
  (table) => {
    return {
      emailIdx: index("email_idx").on(table.email),
    };
  }
);

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 127 }).primaryKey(),
  user_id: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  activeExpires: bigint("active_expires", {
    mode: "number",
  }).notNull(),
  idleExpires: bigint("idle_expires", {
    mode: "number",
  }).notNull(),
});

export const email_verification_token = mysqlTable(
  "email_verification_table",
  {
    id: varchar("id", { length: 255 })
      .primaryKey()
      .$defaultFn(() => createId()),
    code: varchar("code", { length: 8 }).notNull(),
    user_id: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
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
