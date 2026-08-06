export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { runtime: "vercel-function", status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
