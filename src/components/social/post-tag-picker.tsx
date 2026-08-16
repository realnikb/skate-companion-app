"use client";

import { useMemo, useState } from "react";
import { Search, Tag, Users, X } from "lucide-react";
import styles from "./social.module.scss";

export type PostTagOption = { id: string; name: string; handle?: string; slug?: string; kind: "skater" | "crew" };

export function PostTagPicker({ options }: { options: PostTagOption[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PostTagOption[]>([]);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return options.filter((option) => !selected.some((item) => item.kind === option.kind && item.id === option.id) && (!term || `${option.name} ${option.handle ?? ""}`.toLowerCase().includes(term))).slice(0, 8);
  }, [options, query, selected]);

  const remove = (target: PostTagOption) => setSelected((items) => items.filter((item) => item.kind !== target.kind || item.id !== target.id));
  return <div className={styles.tagPicker}>
    <button type="button" className={styles.tagToggle} onClick={() => setOpen((visible) => !visible)} data-active={open || selected.length > 0}><Tag />Tag skaters or crews{selected.length > 0 && <span>{selected.length}</span>}</button>
    {selected.length > 0 && <div className={styles.selectedTags}>{selected.map((item) => <span key={`${item.kind}:${item.id}`}>{item.kind === "crew" ? <Users /> : <span>@</span>}{item.name}<button type="button" onClick={() => remove(item)} aria-label={`Remove ${item.name}`}><X /></button><input type="hidden" name={item.kind === "crew" ? "tagged_crew_ids" : "tagged_user_ids"} value={item.id} /></span>)}</div>}
    {open && <div className={styles.tagMenu}><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skaters and crews..." autoFocus /></label><div>{matches.map((option) => <button type="button" key={`${option.kind}:${option.id}`} onClick={() => { setSelected((items) => [...items, option]); setQuery(""); }}><i>{option.kind === "crew" ? <Users /> : "@"}</i><span><strong>{option.name}</strong><small>{option.kind === "crew" ? "Crew" : `@${option.handle}`}</small></span></button>)}{!matches.length && <p>No matches found.</p>}</div></div>}
  </div>;
}
