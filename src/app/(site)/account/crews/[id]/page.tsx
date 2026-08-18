import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CreateCrewForm } from "@/components/crews/create-crew-form";
import { createClient } from "@/lib/supabase/server";
import styles from "../../account.module.scss";

function mediaUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return path && base
    ? `${base.replace(/\/$/, "")}/storage/v1/object/public/crew-media/${path}`
    : undefined;
}

export default async function EditAccountCrewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = typeof auth?.claims?.sub === "string" ? auth.claims.sub : null;
  if (!userId) redirect(`/account/sign-in?next=/account/crews/${id}`);
  const [{ data: crew, error }, { data: links }] = await Promise.all([
    supabase
      .from("crews")
      .select(
        "id,slug,name,tagline,description,location,platform,primary_color,styles,languages,recruitment_status,recruitment_details,logo_path,banner_path",
      )
      .eq("id", id)
      .eq("owner_id", userId)
      .maybeSingle(),
    supabase.from("crew_links").select("platform,url").eq("crew_id", id),
  ]);
  if (error || !crew) notFound();
  return (
    <main className={styles.page}>
      <header>
        <div>
          <span>Your profile</span>
          <h1>Edit your crew.</h1>
          <p>
            <Link href="/account">← Back to account</Link>
          </p>
        </div>
        <Link href={`/social/crew/${crew.slug}`}>View public page</Link>
      </header>
      <CreateCrewForm
        crew={{
          ...crew,
          logoUrl: mediaUrl(crew.logo_path),
          bannerUrl: mediaUrl(crew.banner_path),
          links: Object.fromEntries(
            (links ?? []).map((link) => [link.platform, link.url]),
          ),
        }}
      />
    </main>
  );
}
