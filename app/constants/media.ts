/**
 * Media upload configuration defaults
 * Single source of truth for all media upload components
 */

export const MEDIA_DEFAULTS = {
    maxFiles: 4,
    // Raw file size limit - generous to allow ProRAW/Samsung 200MP photos
    // These get optimized to ~500KB anyway, so this is just a sanity check
    maxRawFileSize: 100 * 1024 * 1024, // 100MB - accepts any reasonable photo
    // Optimized file size limit - after compression, should never exceed this
    maxOptimizedFileSize: 5 * 1024 * 1024, // 5MB - sanity check post-optimization
    // Legacy alias for backward compatibility (used by some client configs)
    maxFileSize: 100 * 1024 * 1024, // 100MB - same as maxRawFileSize
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jfif', 'image/heic', 'image/heif'],
    maxDimensions: {
        width: 16384,
        height: 16384
    },
    optimize: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg' as const
    }
} as const;

export type MediaConfig = typeof MEDIA_DEFAULTS;
