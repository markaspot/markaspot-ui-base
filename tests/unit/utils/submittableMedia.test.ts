import { describe, expect, it } from 'vitest';
import { submittableMediaIds } from '@/utils/submittableMedia';
import type { UploadedMedia } from '@/types/form';

const media = (overrides: Partial<UploadedMedia>): UploadedMedia => ({
    id: 'uuid-real',
    preview: 'blob:preview',
    isUploading: false,
    ...overrides
} as UploadedMedia);

describe('submittableMediaIds', () => {
    it('returns ids of successfully uploaded items only', () => {
        const result = submittableMediaIds([
            media({ id: '11111111-1111-1111-1111-111111111111' }),
            media({ id: '22222222-2222-2222-2222-222222222222' })
        ]);
        expect(result).toEqual([
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222'
        ]);
    });

    it('drops items that are still uploading (temp id placeholder)', () => {
        const result = submittableMediaIds([
            media({ id: 'temp-123-abc', isUploading: true }),
            media({ id: 'uuid-done' })
        ]);
        expect(result).toEqual(['uuid-done']);
    });

    it('drops errored items even if upload already settled', () => {
        const result = submittableMediaIds([
            media({ id: 'temp-456-def', isUploading: false, error: 'errors.upload.failed' }),
            media({ id: 'uuid-done' })
        ]);
        expect(result).toEqual(['uuid-done']);
    });

    it('drops offline-cached items (temp id retained, replayed via cachedId)', () => {
        const result = submittableMediaIds([
            media({ id: 'temp-789-ghi', isUploading: false, cachedId: 'idb-1', isOfflineCached: true }),
            media({ id: 'uuid-done' })
        ]);
        expect(result).toEqual(['uuid-done']);
    });

    it('never returns a temp- prefixed id even if not flagged uploading/errored', () => {
        const result = submittableMediaIds([
            media({ id: 'temp-000-xyz', isUploading: false })
        ]);
        expect(result).toEqual([]);
    });

    it('returns an empty array when nothing has finished uploading', () => {
        expect(submittableMediaIds([])).toEqual([]);
        expect(submittableMediaIds([
            media({ id: 'temp-1', isUploading: true }),
            media({ id: 'temp-2', isUploading: false, error: 'x' })
        ])).toEqual([]);
    });

    it('preserves order of valid items', () => {
        const result = submittableMediaIds([
            media({ id: 'a-uuid' }),
            media({ id: 'temp-skip', isUploading: true }),
            media({ id: 'b-uuid' })
        ]);
        expect(result).toEqual(['a-uuid', 'b-uuid']);
    });
});
