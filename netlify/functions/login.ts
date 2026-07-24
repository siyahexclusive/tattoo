import type { Context } from "@netlify/functions";

// Credentials are stored exclusively in Netlify environment variables.
// ADMIN_USERNAME and ADMIN_PASSWORD must be set in the Netlify dashboard.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: credentials not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

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
