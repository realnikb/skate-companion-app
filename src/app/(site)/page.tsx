import { HomePage } from "@/components/home/home-page";
import { SupabaseConfigError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getTricks } from "@/lib/tricks/get-tricks";
import { getCategories } from "@/lib/tricks/get-categories";
import type { Trick, TrickCategory } from "@/types/trick";

export const dynamic = "force-dynamic";

function getChosenName(claims: Record<string, unknown>) {
  const metadata = claims.user_metadata;
  const names = [
    claims.name,
    claims.full_name,
    claims.display_name,
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>).name
      : undefined,
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>).full_name
      : undefined,
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>).display_name
      : undefined,
  ];

  return names
    .find(
      (name): name is string =>
        typeof name === "string" && Boolean(name.trim()),
    )
    ?.trim();
}

export default async function Home() {
  let tricks: Trick[] = [];
  let categories: TrickCategory[] = [];
  let configError: string | undefined;
  let chosenName: string | undefined;

  try {
    [tricks, categories] = await Promise.all([getTricks(), getCategories()]);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      configError = error.message;
    } else {
      throw error;
    }
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) chosenName = getChosenName(data.claims);
  } catch {
    /* Signed-out and unavailable-auth states use the public greeting. */
  }

  return (
    <HomePage
      tricks={tricks}
      categories={categories}
      configError={configError}
      chosenName={chosenName}
    />
  );
}
