import { GitHub } from "arctic";
import { Google } from "arctic";

// Load GitHub secrets
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("Error while configuring application");
}

// Load Google secrets
if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.GOOGLE_REDIRECT_URL
) {
  throw new Error("Error while configuring application");
}

// Initialize GitHub client for OAuth2
export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID,
  process.env.GITHUB_CLIENT_SECRET
);

// Initialize Google client for OAuth2
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);
