import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import styles from "./content-page.module.scss";

export const dynamic = "force-dynamic";

async function getPage(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Unable to load page: ${error.message}`);
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}): Promise<Metadata> {
  const { pageSlug } = await params;
  const page = await getPage(pageSlug);
  return page
    ? {
        title: `${page.title} | Skate Companion`,
        description: page.summary ?? undefined,
      }
    : { title: "Page not found | Skate Companion" };
}

function PageBody({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);
  const content: React.ReactNode[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      content.push(<h3 key={index}>{line.slice(4)}</h3>);
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      content.push(<h2 key={index}>{line.slice(3)}</h2>);
      index += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      const start = index;
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      content.push(
        <ul key={start}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ul>,
      );
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("## ") &&
      !lines[index].trim().startsWith("### ") &&
      !lines[index].trim().startsWith("- ")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    content.push(<p key={index}>{paragraph.join(" ")}</p>);
  }
  return content;
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = await params;
  const page = await getPage(pageSlug);
  if (!page) notFound();
  return (
    <main className={styles.page}>
      <header>
        <span>{page.eyebrow ?? "Skate Companion"}</span>
        <h1>{page.title}</h1>
        {page.summary && <p>{page.summary}</p>}
        <small>
          Last updated{" "}
          {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
            new Date(page.updated_at),
          )}
        </small>
      </header>
      <article>
        <PageBody body={page.body} />
      </article>
    </main>
  );
}
