import type { Context } from "@netlify/functions";

// In a production app, these would be stored in a secure database.
// For now, credentials are read from Netlify environment variables.
// Set ADMIN_USERNAME and ADMIN_PASSWORD in your Netlify site's environment settings.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { username, password } = body;

    if (
      username?.trim() === ADMIN_USERNAME &&
      password === ADMIN_PASSWORD
    ) {
      return new Response(
        JSON.stringify({
          id: "admin_user",
          username: ADMIN_USERNAME,
          role: "ADMIN",
          fullName: "Studio Administrator",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
