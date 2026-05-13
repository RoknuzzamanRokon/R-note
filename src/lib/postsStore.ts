/**
 * Module-level singleton so Sidebar + DocsPage share one in-flight request.
 * The promise is reused if already pending — no duplicate network calls.
 */
import { getAllPosts, type Post } from "./api";

let promise: Promise<Post[]> | null = null;
let resolved: Post[] | null = null;

export const prefetchPosts = (): Promise<Post[]> => {
    if (resolved) return Promise.resolve(resolved);
    if (!promise) {
        promise = getAllPosts().then((posts) => {
            resolved = posts;
            return posts;
        }).catch((e) => {
            promise = null; // allow retry on error
            throw e;
        });
    }
    return promise;
};

export const getCachedPosts = (): Post[] | null => resolved;

export const invalidatePosts = () => {
    promise = null;
    resolved = null;
};
