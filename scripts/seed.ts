import { config } from "dotenv";
import { db, conn } from "@/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { users } from "@/db/schema";

// Load environment variables from .env file
config({ path: ".env.local" });

const generateUser = () => {
  return {
    id: createId(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    emailVerified: false,
    bio: faker.person.bio(),
    link: faker.internet.url(),
    profileImage: faker.image.avatar(),
    coverImage: faker.image.url(),
  };
};

async function seed() {
  try {
    // Generate mock user data
    const mockUsers = Array.from({ length: 10 }, generateUser);

    //
    for (const user of mockUsers) {
      await db.insert(users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        bio: user.bio,
        link: user.link,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
      });
    }

    // Output the result
    console.log("Database seeded successfully");
  } catch (error) {
    // Output the error
    console.error("Error during seeding: ", error);
    // Terminate the process
    process.exit(1);
  } finally {
    // Close database connection
    await conn.end();
  }
}

seed().then(() => process.exit());
