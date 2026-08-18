"use client";

import { ExternalLink, Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { parseDiscordInviteCode } from "@/lib/discord/public-invite";
import styles from "./discord-community.module.scss";

type Preview = { guildName: string; memberCount: number; onlineCount: number };

export function DiscordCommunity({
  inviteUrl,
  serverName,
  memberCount,
  onlineCount,
}: {
  inviteUrl: string;
  serverName: string;
  memberCount?: number;
  onlineCount?: number;
}) {
  const [preview, setPreview] = useState<Preview>({
    guildName: serverName,
    memberCount: memberCount ?? 0,
    onlineCount: onlineCount ?? 0,
  });
  const inviteCode = parseDiscordInviteCode(inviteUrl);

  useEffect(() => {
    if (!inviteCode) return;
    const controller = new AbortController();
    fetch(`/api/discord/invite/${encodeURIComponent(inviteCode)}`, {
      signal: controller.signal,
    })
      .then((response) =>
        response.ok ? (response.json() as Promise<Preview>) : Promise.reject(),
      )
      .then(setPreview)
      .catch(() => undefined);
    return () => controller.abort();
  }, [inviteCode]);

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <span className={styles.discordMark}>D</span>
        <div>
          <small>Discord community</small>
          <strong>{preview.guildName}</strong>
        </div>
      </div>
      <div className={styles.counts}>
        <span>
          <Users />
          <strong>{preview.memberCount.toLocaleString()}</strong>
          <small>Discord members</small>
        </span>
        <span>
          <Radio />
          <strong>{preview.onlineCount.toLocaleString()}</strong>
          <small>Online now</small>
        </span>
      </div>
      <p>
        Community counts are approximate. Verified crew roster members are shown
        separately.
      </p>
      <a href={inviteUrl} target="_blank" rel="noreferrer">
        Join Discord <ExternalLink />
      </a>
    </section>
  );
}
