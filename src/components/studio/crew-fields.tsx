import styles from "@/app/studio/studio.module.scss";

type Profile = { id: string; handle: string; display_name: string };
type CrewValue = { id?: string; owner_id?: string; name?: string; slug?: string; tagline?: string | null; description?: string | null; location?: string | null; platform?: string | null; primary_color?: string; styles?: string[]; languages?: string[]; recruitment_status?: string; recruitment_details?: string | null; is_published?: boolean };

export function CrewFields({ profiles, crew = {} }: { profiles: Profile[]; crew?: CrewValue }) {
    return <>
        {crew.id && <input type="hidden" name="id" value={crew.id} />}
        <section className={`${styles.panel} ${styles.detailsPanel}`}><h2>Crew details</h2>
            <div className={styles.fieldRow}><div className={styles.field}><label htmlFor="name">Name *</label><input id="name" name="name" defaultValue={crew.name} required maxLength={60} /></div><div className={styles.field}><label htmlFor="slug">Slug *</label><input id="slug" name="slug" defaultValue={crew.slug} required maxLength={48} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div></div>
            <div className={styles.field}><label htmlFor="tagline">Tagline</label><input id="tagline" name="tagline" defaultValue={crew.tagline ?? ""} maxLength={100} /></div>
            <div className={styles.field}><label htmlFor="description">Description</label><textarea id="description" name="description" defaultValue={crew.description ?? ""} maxLength={2000} /></div>
            <div className={styles.fieldRow}><div className={styles.field}><label htmlFor="location">Location</label><input id="location" name="location" defaultValue={crew.location ?? ""} /></div><div className={styles.field}><label htmlFor="platform">Platform</label><select id="platform" name="platform" defaultValue={crew.platform ?? "Cross-platform"}><option>Cross-platform</option><option>PC</option><option>PlayStation</option><option>Xbox</option></select></div></div>
            <div className={styles.fieldRow}><div className={styles.field}><label htmlFor="styles">Styles</label><input id="styles" name="styles" defaultValue={crew.styles?.join(", ")} placeholder="Realism, filming, social" /></div><div className={styles.field}><label htmlFor="languages">Languages</label><input id="languages" name="languages" defaultValue={crew.languages?.join(", ") ?? "en"} placeholder="en, fr, de" /></div></div>
            <div className={styles.field}><label htmlFor="recruitment_details">Recruitment details</label><textarea id="recruitment_details" name="recruitment_details" defaultValue={crew.recruitment_details ?? ""} maxLength={1500} /></div>
        </section>
        <aside className={`${styles.panel} ${styles.publishingPanel}`}><h2>Ownership & publishing</h2>
            <div className={styles.field}><label htmlFor="owner_id">Owner *</label><select id="owner_id" name="owner_id" defaultValue={crew.owner_id ?? ""} required><option value="" disabled>Select a player</option>{profiles.map(profile => <option value={profile.id} key={profile.id}>{profile.display_name} (@{profile.handle})</option>)}</select></div>
            <div className={styles.field}><label htmlFor="primary_color">Primary colour</label><input id="primary_color" name="primary_color" type="color" defaultValue={crew.primary_color ?? "#7957FF"} /></div>
            <div className={styles.field}><label htmlFor="recruitment_status">Recruitment</label><select id="recruitment_status" name="recruitment_status" defaultValue={crew.recruitment_status ?? "closed"}><option value="recruiting">Recruiting now</option><option value="invite-only">Invite only</option><option value="closed">Closed</option></select></div>
            <div className={styles.field}><label htmlFor="is_published">Visibility</label><select id="is_published" name="is_published" defaultValue={String(crew.is_published ?? false)}><option value="false">Draft</option><option value="true">Published</option></select></div>
            <div className={styles.field}><label htmlFor="logo">{crew.id ? "Replace logo" : "Logo *"}</label><input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required={!crew.id} /></div>
            <div className={styles.field}><label htmlFor="banner">{crew.id ? "Replace banner" : "Banner"}</label><input id="banner" name="banner" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></div>
        </aside>
    </>;
}
