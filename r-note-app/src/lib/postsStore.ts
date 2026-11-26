/**
 * Module-level singleton so Sidebar + DocsPage share one in-flight request
 * per category. Promises are reused if already pending — no duplicate calls.
 */
import { getAllPostsByCategory, getPosts, type Post, type CategorySummary } from "./api";

type CategoryCache = {
    promise: Promise<Post[]> | null;
    resolved: Post[] | null;
};

const store = new Map<string, CategoryCache>();

const getEntry = (category: string): CategoryCache => {
    if (!store.has(category)) store.set(category, { promise: null, resolved: null });
    return store.get(category)!;
};

export const prefetchPosts = (category = "Development"): Promise<Post[]> => {
    const entry = getEntry(category);
    if (entry.resolved) return Promise.resolve(entry.resolved);
    if (!entry.promise) {
        entry.promise = getAllPostsByCategory(category)
            .then((posts) => {
                entry.resolved = posts;
                return posts;
            })
            .catch((e) => {
                entry.promise = null; // allow retry on error
                throw e;
            });
    }
    return entry.promise;
};

export const getCachedPosts = (category = "Development"): Post[] | null =>
    store.get(category)?.resolved ?? null;

export const invalidatePosts = (category?: string) => {
    if (category) {
        store.delete(category);
    } else {
        store.clear();
    }
};

// ── Category summary ──────────────────────────────────────────────────────────

let categorySummaryPromise: Promise<CategorySummary[]> | null = null;
let categorySummaryResolved: CategorySummary[] | null = null;

export const prefetchCategories = (): Promise<CategorySummary[]> => {
    if (categorySummaryResolved) return Promise.resolve(categorySummaryResolved);
    if (!categorySummaryPromise) {
        categorySummaryPromise = getPosts({ limit: 1 })
            .then((res) => {
                categorySummaryResolved = res.category_summary;
                return res.category_summary;
            })
            .catch((e) => {
                categorySummaryPromise = null;
                throw e;
            });
    }
    return categorySummaryPromise;
};

export const getCachedCategories = (): CategorySummary[] | null =>
    categorySummaryResolved;

/** Forget the category list so the next prefetchCategories() asks the API. */
export const invalidateCategories = () => {
    categorySummaryPromise = null;
    categorySummaryResolved = null;
};
