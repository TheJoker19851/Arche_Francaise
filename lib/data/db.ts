import { createClient, Client } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add it to your .env.local file."
    );
  }

  _client = createClient({
    url,
    authToken: authToken || undefined,
  });

  return _client;
}
