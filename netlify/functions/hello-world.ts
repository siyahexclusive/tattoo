import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  return new Response("Hello from your new Netlify function!");
};
