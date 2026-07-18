import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

const clientID = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/callback/google";

export function getOAuthClient() {
  return new OAuth2Client(clientID, clientSecret, redirectUri);
}

export function getGmailClient(auth: OAuth2Client) {
  return google.gmail({ version: "v1", auth: auth as any });
}

export function getCalendarClient(auth: OAuth2Client) {
  return google.calendar({ version: "v3", auth: auth as any });
}

// Parses JSON token stored in db and returns authenticated OAuth2Client
export function getAuthenticatedClient(tokenJson: string) {
  const oauth2Client = getOAuthClient();
  const tokens = JSON.parse(tokenJson);
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}
