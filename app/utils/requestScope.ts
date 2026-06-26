interface RequestLike {
    context?: Record<string, unknown>
}

interface RequestScopedValueOptions<T> {
    event?: RequestLike | null
    key: string
    create: () => T
    clientValue: T
}

/**
 * Store mutable helpers per SSR request instead of at module scope.
 * Falls back to a client-side singleton when no request context exists.
 */
export function getRequestScopedValue<T>(options: RequestScopedValueOptions<T>): T {
    const { event, key, create, clientValue } = options;

    if (event?.context) {
        const hasExisting = Object.prototype.hasOwnProperty.call(event.context, key);
        if (!hasExisting) {
            event.context[key] = create();
        }
        return event.context[key] as T;
    }

    return clientValue;
}
