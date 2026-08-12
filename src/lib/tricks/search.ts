import type { Trick } from "@/types/trick";

const lineSeparatorPattern = /\s*(?:,|>|→|\b(?:to|into|then)\b)\s*/gi;
const lineSeparatorTestPattern = /(?:,|>|→|\b(?:to|into|then)\b)/i;

function normalizeSearchValue(value: string) {
    return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function searchableValues(trick: Trick) {
    return [trick.name, ...trick.aliases].map(normalizeSearchValue);
}

export function matchesTrickSearch(trick: Trick, query: string) {
    const normalizedQuery = normalizeSearchValue(query);
    return !normalizedQuery || searchableValues(trick).some((value) => value.includes(normalizedQuery));
}

function findLineTrick(tricks: Trick[], query: string) {
    const normalizedQuery = normalizeSearchValue(query);
    const exactMatch = tricks.find((trick) => searchableValues(trick).includes(normalizedQuery));
    if (exactMatch) return exactMatch;

    const partialMatches = tricks.filter((trick) =>
        searchableValues(trick).some((value) => value.includes(normalizedQuery)),
    );
    return partialMatches.length === 1 ? partialMatches[0] : undefined;
}

export type TrickLineSearch = {
    isLineQuery: boolean;
    segments: string[];
    matches: Array<Trick | null>;
    tricks: Trick[];
    unresolved: string[];
    isComplete: boolean;
};

export function parseTrickLine(query: string, tricks: Trick[], maximumLength = 3): TrickLineSearch {
    const isLineQuery = lineSeparatorTestPattern.test(query);
    const segments = isLineQuery
        ? query.split(lineSeparatorPattern).map((segment) => segment.trim()).filter(Boolean)
        : [];
    const resolved = segments.map((segment) => ({ segment, trick: findLineTrick(tricks, segment) }));
    const matchedTricks = resolved
        .map(({ trick }) => trick)
        .filter((trick): trick is Trick => Boolean(trick));
    const uniqueTricks = matchedTricks.filter(
        (trick, index) => matchedTricks.findIndex((candidate) => candidate.slug === trick.slug) === index,
    );
    const unresolved = resolved.filter(({ trick }) => !trick).map(({ segment }) => segment);

    return {
        isLineQuery,
        segments,
        matches: resolved.map(({ trick }) => trick ?? null),
        tricks: uniqueTricks.slice(0, maximumLength),
        unresolved,
        isComplete: isLineQuery
            && segments.length >= 2
            && segments.length <= maximumLength
            && unresolved.length === 0
            && uniqueTricks.length === segments.length,
    };
}
