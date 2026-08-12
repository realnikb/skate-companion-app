import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { TrickPageContent } from "@/components/tricks/trick-page-content";
import { TrickDirectory } from "@/components/tricks/trick-directory";
import { getCategories } from "@/lib/tricks/get-categories";
import { getTrick } from "@/lib/tricks/get-trick";
import { getTricks } from "@/lib/tricks/get-tricks";
import { getCategoryTheme } from "@/lib/tricks/category-theme";
import type { NormalizedControlInput } from "@/types/trick";
import { hasControls } from "@/lib/tricks/controls";
import directoryPageStyles from "../tricks.module.scss";

export const dynamic = "force-dynamic";
const getCachedTrick = cache(getTrick);
type Props = { params: Promise<{ slug: string }> };

function describeControl(control: NormalizedControlInput) {
    if (control.type === "stick") return `${control.action.replaceAll("-", " ")} the ${control.stick} stick along the shown path`;
    return `${control.action} ${control.control.replaceAll("-", " ")}`;
}

function categoryHeading(category: { name: string; pageHeading?: string }) {
    return (category.pageHeading || "How to do {category}").replaceAll("{category}", category.name);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const category = (await getCategories()).find((item) => item.slug === slug);
    if (category) {
        const title = `EA Skate ${category.name} | Controls, Videos & Trick Guides`;
        const description = `Learn how to do ${category.name.toLowerCase()} in EA Skate. Browse popular ${category.name.toLowerCase()}, controller inputs and video guides in the EA Skate Online Skatepedia.`;
        return { title, description, alternates: { canonical: `/tricks/${category.slug}` }, openGraph: { title, description, type: "website", url: `/tricks/${category.slug}` } };
    }
    try {
        const trick = await getCachedTrick(slug);
        const article = /^[aeiou]/i.test(trick.name) ? "an" : "a";
        const title = `How to Do ${article} ${trick.name} in EA skate. | Controls & Video`;
        const description = `Learn how to do ${article} ${trick.name} in EA skate. with Xbox and PlayStation controls, Flick-It inputs, timing guidance, and a video demonstration.`;
        return { title, description, alternates: { canonical: `/tricks/${trick.slug}` }, openGraph: { title, description, type: "article", images: trick.posterUrl ? [{ url: trick.posterUrl, alt: `${trick.name} demonstration in EA skate.` }] : [] }, twitter: { card: "summary_large_image", title, description, images: trick.posterUrl ? [trick.posterUrl] : [] } };
    } catch { return { title: "Trick not found | Skate Companion" }; }
}

export default async function TrickPage({ params }: Props) {
    const { slug } = await params;
    const categories = await getCategories();
    const landingCategory = categories.find((item) => item.slug === slug);
    if (landingCategory) {
        const tricks = await getTricks({ categorySlug: landingCategory.slug });
        const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: `EA Skate ${landingCategory.name} trick guides`, description: landingCategory.description ?? `Learn how to do ${landingCategory.name.toLowerCase()} in EA Skate.`, mainEntity: { "@type": "ItemList", numberOfItems: tricks.length, itemListElement: tricks.map((trick, index) => ({ "@type": "ListItem", position: index + 1, name: `How to do a ${trick.name} in EA Skate`, url: `/tricks/${trick.slug}` })) } };
        const heading = categoryHeading(landingCategory);
        const categoryNameIndex = heading.toLocaleLowerCase().lastIndexOf(landingCategory.name.toLocaleLowerCase());
        const heroStyle = {
            ...getCategoryTheme(landingCategory),
            ...(landingCategory.heroImageUrl ? { backgroundImage: `linear-gradient(110deg,rgba(10,12,16,.88),rgba(10,12,16,.55)),url("${landingCategory.heroImageUrl.replaceAll('"', "%22")}")` } : {}),
        };
        return <main className={directoryPageStyles.main}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} /><section className={directoryPageStyles.hero} style={heroStyle}><div className={directoryPageStyles.heroInner}><span>{landingCategory.pageEyebrow ?? "EA Skate Online Skatepedia"}</span><h1>{categoryNameIndex >= 0 ? <>{heading.slice(0, categoryNameIndex)}<br /><em>{heading.slice(categoryNameIndex)}</em></> : heading}</h1><p>{landingCategory.description ?? `Learn every ${landingCategory.name.toLowerCase()} in EA Skate with controller inputs, video demonstrations and focused trick guides.`}</p></div></section><div className={directoryPageStyles.content}><TrickDirectory activeCategory={landingCategory} categories={categories} tricks={tricks} /></div></main>;
    }
    let trick;
    try { trick = await getCachedTrick(slug); } catch { notFound(); }
    const tricks = await getTricks();
    const category = categories.find((item) => item.slug === trick.category) ?? null;
    const article = /^[aeiou]/i.test(trick.name) ? "an" : "a";
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to do ${article} ${trick.name} in EA skate.`,
        description: trick.description,
        image: trick.posterUrl,
        step: hasControls(trick.controls)
            ? trick.controls.variants.flatMap((variant) => variant.steps).map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: `Input ${index + 1}`, text: step.inputs.map((input, inputIndex) => `${inputIndex ? input.join === "or" ? "or " : "and " : ""}${describeControl(input)}`).join(" ") }))
            : [{ "@type": "HowToStep", position: 1, name: "Follow the Flick-It input", text: "Follow the controller input shown in the trick guide, then match the demonstration timing." }],
    };
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} /><TrickPageContent trick={trick} tricks={tricks} category={category} categories={categories} /></>;
}
