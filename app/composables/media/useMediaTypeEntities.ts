/**
 * Composable to fetch Media entities of a given Drupal Media Type.
 *
 * Used by the `imagelist` service definition attribute datatype.
 * Loads all media entities of a specific type via JSON:API,
 * resolving thumbnail URLs from included file entities.
 */
import { useApiClient } from '~/composables/api/useApiClient';

export interface MediaEntityOption {
    id: string
    name: string
    imageUrl: string
}

interface JsonApiFileAttributes {
    uri?: { url?: string }
}

interface JsonApiMediaAttributes {
    name: string
    drupal_internal__mid?: number
}

interface JsonApiResource {
    id: string
    type: string
    attributes: JsonApiMediaAttributes | JsonApiFileAttributes
    relationships?: {
        thumbnail?: {
            data: { id: string, type: string } | null
        }
    }
}

interface JsonApiResponse {
    data: JsonApiResource[]
    included?: JsonApiResource[]
    links?: { next?: { href: string } }
}

export const useMediaTypeEntities = (mediaType: MaybeRef<string | undefined>, mediaGroup?: MaybeRef<string | undefined>) => {
    const api = useApiClient();
    const items = ref<MediaEntityOption[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Generation counter to discard stale responses from previous mediaType values
    let fetchGeneration = 0;

    const resolveImageUrl = (path: string): string => {
        // Drupal file paths go through the image proxy
        if (path.includes('/files/') || path.startsWith('/sites/') || path.startsWith('sites/')) {
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            return `/api/images/${cleanPath}`;
        }
        return path;
    };

    const parseResources = (response: JsonApiResponse): MediaEntityOption[] => {
        // Build a map of file entity ID -> image URL from included resources
        const fileUrlMap = new Map<string, string>();
        if (response.included) {
            for (const inc of response.included) {
                if (inc.type === 'file--file') {
                    const fileAttrs = inc.attributes as JsonApiFileAttributes;
                    const url = fileAttrs.uri?.url;
                    if (url) {
                        fileUrlMap.set(inc.id, resolveImageUrl(url));
                    }
                }
            }
        }

        return (response.data || []).map((entity) => {
            const attrs = entity.attributes as JsonApiMediaAttributes;
            const thumbnailId = entity.relationships?.thumbnail?.data?.id;
            const imageUrl = thumbnailId ? fileUrlMap.get(thumbnailId) ?? '' : '';

            return {
                id: entity.id,
                name: attrs.name,
                imageUrl
            };
        });
    };

    const fetchEntities = async () => {
        const type = toValue(mediaType);
        const group = toValue(mediaGroup);
        if (!type) {
            items.value = [];
            return;
        }

        const myGeneration = ++fetchGeneration;
        loading.value = true;
        error.value = null;

        try {
            const allItems: MediaEntityOption[] = [];
            const pageLimit = 50;
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const params: Record<string, string> = {
                    [`fields[media--${type}]`]: 'name,thumbnail',
                    'include': 'thumbnail',
                    'page[limit]': pageLimit.toString(),
                    'page[offset]': offset.toString()
                };
                if (group) {
                    params['filter[field_definition_group][value]'] = group;
                }
                const response = await api.get<JsonApiResponse>(
                    `/jsonapi/media/${type}`,
                    params
                );

                // Discard stale response if mediaType changed during fetch
                if (myGeneration !== fetchGeneration) return;

                allItems.push(...parseResources(response));

                // Follow JSON:API pagination
                if (response.links?.next) {
                    offset += pageLimit;
                } else {
                    hasMore = false;
                }
            }

            // Final staleness check before updating state
            if (myGeneration !== fetchGeneration) return;
            items.value = allItems;
        } catch (e) {
            if (myGeneration !== fetchGeneration) return;
            error.value = e instanceof Error ? e.message : 'Failed to fetch media entities';
            console.error(`[useMediaTypeEntities] Failed to fetch media type "${type}"${group ? ` (group: "${group}")` : ''}:`, e);
            items.value = [];
        } finally {
            if (myGeneration === fetchGeneration) {
                loading.value = false;
            }
        }
    };

    // Refetch when media type or group changes (unconditional: fetchEntities handles falsy types)
    watch(
        [() => toValue(mediaType), () => toValue(mediaGroup)],
        () => {
            fetchEntities();
        },
        { immediate: true }
    );

    return {
        items: readonly(items),
        loading: readonly(loading),
        error: readonly(error),
        refresh: fetchEntities
    };
};
