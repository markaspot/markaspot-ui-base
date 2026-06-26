import type { UploadedMedia } from '@/types/form';

/**
 * Returns the media ids that are safe to send in `field_request_media`.
 *
 * Only successfully-uploaded items carry a real Drupal media UUID. While an
 * upload is in flight, has errored, or is offline-cached, the item still holds
 * its `temp-<ts>-<rand>` placeholder id. Sending those
 * makes Drupal reject the submit with a 422 referencing a photo the citizen
 * sees as "attached". Both report forms must filter identically, so the logic
 * lives here to prevent the two implementations from drifting apart.
 *
 * Offline-cached items are intentionally dropped from the online submit path:
 * the offline queue replays them through their `cachedId` instead.
 */
export function submittableMediaIds(media: UploadedMedia[]): string[] {
    return media
        .filter(m => !m.isUploading && !m.error && !m.id.startsWith('temp-'))
        .map(m => m.id);
}
