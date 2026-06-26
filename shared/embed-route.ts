export function isEmbedRoutePath(path: string): boolean {
    return /^\/(?:[^/]+\/)?embed(?:\/|$)/.test(path);
}
