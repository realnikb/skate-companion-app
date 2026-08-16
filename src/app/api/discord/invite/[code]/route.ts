import { getDiscordInvitePreview } from "@/lib/discord/invite";

export async function GET(_request: Request, context: RouteContext<"/api/discord/invite/[code]">) {
    const { code } = await context.params;
    if (!/^[A-Za-z0-9_-]{2,64}$/.test(code)) return Response.json({ error: "Invalid Discord invite code." }, { status: 400 });

    try {
        const preview = await getDiscordInvitePreview(code);
        return Response.json(preview, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
    } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : "Discord is unavailable." }, { status: 404 });
    }
}
