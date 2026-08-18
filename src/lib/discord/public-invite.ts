export function parseDiscordInviteCode(value: string) {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{2,64}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (
      !["discord.gg", "discord.com", "www.discord.com"].includes(url.hostname)
    )
      return null;
    return (
      url.pathname.match(/^\/(?:invite\/)?([A-Za-z0-9_-]{2,64})\/?$/)?.[1] ??
      null
    );
  } catch {
    return null;
  }
}
