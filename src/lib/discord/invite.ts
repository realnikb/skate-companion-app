import "server-only";

export type DiscordInvitePreview = {
  inviteCode: string;
  guildId: string;
  guildName: string;
  guildIconUrl: string | null;
  memberCount: number;
  onlineCount: number;
};

type DiscordInviteResponse = {
  code?: string;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  guild?: { id?: string; name?: string; icon?: string | null };
  message?: string;
};

export function parseDiscordInviteCode(value: string) {
  const trimmed = value.trim();
  const directCode = /^[A-Za-z0-9_-]{2,64}$/.test(trimmed) ? trimmed : null;
  if (directCode) return directCode;

  try {
    const url = new URL(trimmed);
    const allowedHost =
      url.hostname === "discord.gg" ||
      url.hostname === "discord.com" ||
      url.hostname === "www.discord.com";
    if (!allowedHost) return null;
    const match = url.pathname.match(
      /^\/(?:invite\/)?([A-Za-z0-9_-]{2,64})\/?$/,
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function getDiscordInvitePreview(
  inviteCode: string,
): Promise<DiscordInvitePreview> {
  if (!/^[A-Za-z0-9_-]{2,64}$/.test(inviteCode))
    throw new Error("Invalid Discord invite code.");

  const response = await fetch(
    `https://discord.com/api/v10/invites/${encodeURIComponent(inviteCode)}?with_counts=true&with_expiration=true`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "SkateCompanion/1.0",
      },
      next: { revalidate: 1800 },
    },
  );
  const data = (await response.json()) as DiscordInviteResponse;
  if (!response.ok || !data.guild?.id || !data.guild.name)
    throw new Error(data.message ?? "Discord invite could not be read.");

  return {
    inviteCode: data.code ?? inviteCode,
    guildId: data.guild.id,
    guildName: data.guild.name,
    guildIconUrl: data.guild.icon
      ? `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.webp?size=128`
      : null,
    memberCount: data.approximate_member_count ?? 0,
    onlineCount: data.approximate_presence_count ?? 0,
  };
}
