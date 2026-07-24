import type { Context } from "@netlify/functions";

// Credentials are stored exclusively in Netlify environment variables.
// ADMIN_USERNAME and ADMIN_PASSWORD must be set in the Netlify dashboard.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export default async (req: Request, context: Context) => {
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
    const { currentUsername, currentPassword, newUsername, newPassword } = body;

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: credentials not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      currentUsername?.trim() !== ADMIN_USERNAME ||
      currentPassword !== ADMIN_PASSWORD
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid current credentials" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Credentials are managed via Netlify environment variables.
    // Return a helpful message explaining how to persist the change.
    return new Response(
      JSON.stringify({
        id: "admin_user",
        username: newUsername || ADMIN_USERNAME,
        role: "ADMIN",
        fullName: "Studio Administrator",
        message:
          "To permanently change credentials, update ADMIN_USERNAME and ADMIN_PASSWORD in your Netlify site environment variables.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
