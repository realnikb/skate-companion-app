import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePath = process.argv[2];
const outputPath = process.argv[3] ?? "supabase/seed.sql";

if (!sourcePath) {
  throw new Error(
    "Usage: node scripts/generate-skatepedia-seed.mjs <skatepedia.json> [output.sql]",
  );
}

const document = JSON.parse(await readFile(sourcePath, "utf8"));
const tricks = document.tricks;

if (!Array.isArray(tricks) || tricks.length === 0) {
  throw new Error("The source must contain a non-empty tricks array.");
}

const quote = (value) =>
  value === null || value === undefined
    ? "null"
    : `'${String(value).replaceAll("'", "''")}'`;
const bool = (value) => (value ? "true" : "false");
const json = (value) => `${quote(JSON.stringify(value))}::jsonb`;
const textArray = (values) =>
  values.length
    ? `array[${values.map(quote).join(", ")}]::text[]`
    : "'{}'::text[]";

const categoryDetails = {
  riding: [
    "Riding",
    "Movement fundamentals, setup motions, and board control.",
  ],
  "flip-tricks": ["Flip Tricks", "Flatground flips and board rotations."],
  grinds: ["Grinds", "Rail and ledge grinds."],
  grabs: ["Grabs", "Air tricks focused on grabs and style."],
  "finger-flips": [
    "Finger Flips",
    "Finger-flip variations performed from grabs and aerial positions.",
  ],
  "off-board": ["Off-board", "On-foot and board-handling tricks."],
  plants: ["Plants", "Handplants, footplants, and related tricks."],
  "dark-tricks": ["Dark Tricks", "Dark catches, slides, and grinds."],
  terminology: [
    "Terminology",
    "Reference entries for skateboarding terminology.",
  ],
};

const fingerFlipSlugs = new Set([
  "bs-fingerflip",
  "fs-fingerflip",
  "fingerflip",
  "coffin-fingerflip",
  "double-grab-fingerflip",
]);
const categorySlugFor = (trick) =>
  fingerFlipSlugs.has(trick.slug) ? "finger-flips" : trick.category_slug;
const categorySlugs = [...new Set(tricks.map(categorySlugFor))];
const missingCategoryDetails = categorySlugs.filter(
  (slug) => !categoryDetails[slug],
);
if (missingCategoryDetails.length) {
  throw new Error(
    `Missing category details for: ${missingCategoryDetails.join(", ")}`,
  );
}

const duplicateSlugs = tricks
  .map((trick) => trick.slug)
  .filter((slug, index, values) => values.indexOf(slug) !== index);
if (duplicateSlugs.length) {
  throw new Error(
    `Duplicate trick slugs: ${[...new Set(duplicateSlugs)].join(", ")}`,
  );
}

const requiredMedia = [
  "video_file",
  "controls_reference_file",
  "controls_clean_file",
];
for (const trick of tricks) {
  for (const field of requiredMedia) {
    if (!trick.media?.[field])
      throw new Error(`${trick.slug} is missing media.${field}`);
  }
}

const categoryRows = categorySlugs.map((slug, index) => {
  const [name, description] = categoryDetails[slug];
  return `    (${quote(slug)}, ${quote(name)}, ${quote(description)}, ${(index + 1) * 10}, true)`;
});

const trickRows = tricks.map(
  (trick, index) => `    (
        ${quote(categorySlugFor(trick))}, ${quote(trick.slug)}, ${quote(trick.name)},
        ${quote(trick.description)}, ${quote(trick.detected_description)}, ${quote(trick.context)},
        ${textArray(trick.aliases ?? [])}, ${json(trick.controls ?? [])},
        ${quote(trick.media.video_file)}, ${quote(trick.media.poster_file)},
        ${quote(trick.media.controls_reference_file)}, ${quote(trick.media.controls_clean_file)},
        ${quote(trick.media.source_frame_file)}, ${trick.source_metadata?.start ?? "null"},
        ${trick.source_metadata?.end ?? "null"}, ${trick.source_metadata?.ocr_confidence ?? "null"},
        ${bool(trick.needs_name_review)}, ${bool(trick.needs_control_review)},
        ${bool(trick.needs_description_review)}, ${index + 1}, true
    )`,
);

const sql = `-- Generated from ${path.basename(sourcePath)}. Do not edit by hand.
insert into public.trick_categories (slug, name, description, sort_order, is_published)
values
${categoryRows.join(",\n")}
on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published;

with trick_rows (
    category_slug, slug, name, description, detected_description, context,
    aliases, controls, video_path, poster_path, controls_reference_path,
    controls_clean_path, source_frame_path, source_start_seconds,
    source_end_seconds, ocr_confidence, needs_name_review,
    needs_control_review, needs_description_review, sort_order, is_published
) as (
values
${trickRows.join(",\n")}
)
insert into public.tricks (
    category_id, slug, name, description, detected_description, context,
    aliases, controls, video_path, poster_path, controls_reference_path,
    controls_clean_path, source_frame_path, source_start_seconds,
    source_end_seconds, ocr_confidence, needs_name_review,
    needs_control_review, needs_description_review, sort_order, is_published
)
select
    category.id, rows.slug, rows.name, rows.description, rows.detected_description,
    rows.context, rows.aliases, rows.controls, rows.video_path, rows.poster_path,
    rows.controls_reference_path, rows.controls_clean_path, rows.source_frame_path,
    rows.source_start_seconds, rows.source_end_seconds, rows.ocr_confidence,
    rows.needs_name_review, rows.needs_control_review, rows.needs_description_review,
    rows.sort_order, rows.is_published
from trick_rows rows
join public.trick_categories category on category.slug = rows.category_slug;
`;

await writeFile(outputPath, sql);
console.log(
  `Wrote ${tricks.length} tricks across ${categorySlugs.length} categories to ${outputPath}`,
);
