import { GitHub } from "arctic";
import { Google } from "arctic";

// Load GitHub secrets
if (
  !process.env.OAUTH_GITHUB_CLIENT_ID ||
  !process.env.OAUTH_GITHUB_CLIENT_SECRET ||
  !process.env.OAUTH_GITHUB_REDIRECT_URL
) {
  throw new Error("Error while configuring application");
}

// Load Google secrets
if (
  !process.env.OAUTH_GOOGLE_CLIENT_ID ||
  !process.env.OAUTH_GOOGLE_CLIENT_SECRET ||
  !process.env.OAUTH_GOOGLE_REDIRECT_URL
) {
  throw new Error("Error while configuring application");
}

// Initialize GitHub client for OAuth2
export const github = new GitHub(
  process.env.OAUTH_GITHUB_CLIENT_ID,
  process.env.OAUTH_GITHUB_CLIENT_SECRET,
  {
    redirectURI: process.env.OAUTH_GITHUB_REDIRECT_URL,
  }
);

// Initialize Google client for OAuth2
export const google = new Google(
  process.env.OAUTH_GOOGLE_CLIENT_ID,
  process.env.OAUTH_GOOGLE_CLIENT_SECRET,
  process.env.OAUTH_GOOGLE_REDIRECT_URL
);
