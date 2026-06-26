const BLOCKED_OVERRIDE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

type OverrideObject = Record<string, unknown>;

const createOverrideObject = (): OverrideObject => Object.create(null) as OverrideObject;

const isSafeOverridePath = (segments: string[]): boolean =>
    segments.every(segment => segment && !BLOCKED_OVERRIDE_PATH_SEGMENTS.has(segment));

export function unflattenI18nOverrideObject(overrides: Record<string, string>): OverrideObject {
    const result = createOverrideObject();

    for (const key of Object.keys(overrides)) {
        const segments = key.split('.');
        if (!isSafeOverridePath(segments)) continue;

        let current = result;
        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            const existing = Object.prototype.hasOwnProperty.call(current, segment)
                ? current[segment]
                : undefined;

            if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
                current[segment] = createOverrideObject();
            }

            current = current[segment] as OverrideObject;
        }

        current[segments[segments.length - 1]] = overrides[key];
    }

    return result;
}
