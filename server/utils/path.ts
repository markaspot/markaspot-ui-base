/**
 * Detect traversal attempts (raw or encoded) and disallow absolute URLs.
 */
export const isSuspiciousPath = (path: string): boolean => {
    if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
        return true;
    }

    const candidates = [path];
    try {
        const decoded = decodeURIComponent(path);
        if (decoded !== path) {
            candidates.push(decoded);
        }
    } catch {
    // ignore decode errors
    }

    return candidates.some(candidate =>
        candidate.split('/').some(segment => segment === '..')
    );
};
