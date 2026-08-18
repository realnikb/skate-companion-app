import { createClient } from "@/lib/supabase/server";
import {
  getDiscordInvitePreview,
  parseDiscordInviteCode,
} from "@/lib/discord/invite";

export async function POST(
  request: Request,
  context: RouteContext<"/api/crews/[crewId]/discord">,
) {
  const { crewId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(crewId))
    return Response.json({ error: "Invalid crew." }, { status: 400 });

  const body = (await request.json().catch(() => null)) as {
    inviteUrl?: unknown;
  } | null;
  const inviteUrl =
    typeof body?.inviteUrl === "string" ? body.inviteUrl.trim() : "";
  const inviteCode = parseDiscordInviteCode(inviteUrl);
  if (!inviteCode)
    return Response.json(
      { error: "Enter a valid discord.gg or discord.com/invite link." },
      { status: 400 },
    );

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims)
    return Response.json(
      { error: "Sign in to connect Discord." },
      { status: 401 },
    );

  try {
    const preview = await getDiscordInvitePreview(inviteCode);
    const { error: integrationError } = await supabase
      .from("crew_discord_integrations")
      .upsert({
        crew_id: crewId,
        invite_code: preview.inviteCode,
        guild_id: preview.guildId,
        guild_name: preview.guildName,
        guild_icon_url: preview.guildIconUrl,
        approximate_member_count: preview.memberCount,
        approximate_online_count: preview.onlineCount,
        last_synced_at: new Date().toISOString(),
      });
    if (integrationError)
      return Response.json(
        { error: "Only crew staff can connect this Discord server." },
        { status: 403 },
      );

    await supabase
      .from("crew_links")
      .upsert(
        {
          crew_id: crewId,
          platform: "discord",
          url: `https://discord.gg/${preview.inviteCode}`,
        },
        { onConflict: "crew_id,platform" },
      );
    return Response.json(preview);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Discord invite could not be connected.",
      },
      { status: 422 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/crews/[crewId]/discord">,
) {
  const { crewId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(crewId))
    return Response.json({ error: "Invalid crew." }, { status: 400 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims)
    return Response.json(
      { error: "Sign in to disconnect Discord." },
      { status: 401 },
    );
  const { error } = await supabase
    .from("crew_discord_integrations")
    .delete()
    .eq("crew_id", crewId);
  if (error)
    return Response.json(
      { error: "Only crew staff can disconnect this Discord server." },
      { status: 403 },
    );
  await supabase
    .from("crew_links")
    .delete()
    .eq("crew_id", crewId)
    .eq("platform", "discord");
  return new Response(null, { status: 204 });
}
