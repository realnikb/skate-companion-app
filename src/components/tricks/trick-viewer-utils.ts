import type { Trick } from "@/types/trick";

export function getRank(tricks: Trick[], trickId: string, key: "viewCount" | "favouriteCount") {
    return [...tricks]
        .sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name))
        .findIndex((candidate) => candidate.id === trickId) + 1;
}

export function getPopularityRank(tricks: Trick[], trickId: string) {
    const viewOrder = [...tricks].sort((a, b) => b.viewCount - a.viewCount);
    const favouriteOrder = [...tricks].sort((a, b) => b.favouriteCount - a.favouriteCount);

    return [...tricks]
        .sort((a, b) => {
            const aScore = viewOrder.findIndex((item) => item.id === a.id) + favouriteOrder.findIndex((item) => item.id === a.id);
            const bScore = viewOrder.findIndex((item) => item.id === b.id) + favouriteOrder.findIndex((item) => item.id === b.id);
            return aScore - bScore || a.name.localeCompare(b.name);
        })
        .findIndex((candidate) => candidate.id === trickId) + 1;
}

export function ordinal(value: number) {
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
    return `${value}${value % 10 === 1 ? "st" : value % 10 === 2 ? "nd" : value % 10 === 3 ? "rd" : "th"}`;
}

function trickTerms(name: string) {
    return new Set(
        name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((term) => term.length > 1),
    );
}

function relatedTrickScore(source: Trick, candidate: Trick) {
    const sourceTerms = trickTerms(source.name);
    const sharedTerms = [...trickTerms(candidate.name)].filter((term) => sourceTerms.has(term));
    const termScore = sharedTerms.reduce((score, term) => score + Math.min(term.length, 8), 0);
    const categoryScore = candidate.category === source.category ? 3 : 0;
    const contextScore = candidate.context && candidate.context === source.context ? 1 : 0;

    return termScore + categoryScore + contextScore;
}

export function findRelatedTricks(tricks: Trick[], source: Trick, limit = 4) {
    return tricks
        .filter((candidate) => candidate.id !== source.id)
        .map((trick) => ({
            trick,
            relevance: relatedTrickScore(source, trick),
            popularity: trick.viewCount + (trick.favouriteCount * 5),
        }))
        .filter((candidate) => candidate.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance
            || b.popularity - a.popularity
            || a.trick.sortOrder - b.trick.sortOrder
            || a.trick.name.localeCompare(b.trick.name))
        .slice(0, limit);
}
