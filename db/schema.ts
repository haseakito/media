import {
    mysqlTable,
    varchar,
    text,
    boolean,
    date,
    timestamp,
} from "drizzle-orm/mysql-core";
import { createId } from '@paralleldrive/cuid2';

export const users = mysqlTable('users', {
    id:  varchar("id", { length: 255 }).primaryKey().$defaultFn(() => createId()),
    name: varchar("name", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false),
    password: varchar("password", { length: 255 }).notNull(),
    bio: text("bio"),
    link: varchar("link", { length: 255 }),
    dob: date("dob"),
    profileImage: varchar("profile_image", { length: 255 }),
    coverImage: varchar("cover_image", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow()
});
