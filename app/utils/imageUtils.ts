// utils/imageUtils.ts

export interface ImageDimensions {
    width: number
    height: number
}

export interface OptimizationOptions {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
}

export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url); // Clean up blob URL to prevent memory leak
            resolve({
                width: img.width,
                height: img.height
            });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url); // Clean up on error too
            reject(new Error('Failed to load image'));
        };
        img.src = url;
    });
};

export const calculateNewDimensions = (
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): ImageDimensions => {
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
    }

    if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height));
        height = maxHeight;
    }

    return { width, height };
};

export const optimizeImage = async (
    file: File,
    options: OptimizationOptions = {}
): Promise<File> => {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        format = 'jpeg'
    } = options;

    // Convert JFIF to JPEG format for backend compatibility
    const outputFormat = file.type === 'image/jfif' ? 'jpeg' : format;

    // Timeout for canvas operations (30 seconds for large images)
    const OPTIMIZATION_TIMEOUT = 30000;

    return new Promise((resolve, reject) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let imgUrl: string | null = null;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (imgUrl) URL.revokeObjectURL(imgUrl);
        };

        // Set timeout for the entire operation
        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Image optimization timed out - file may be too large'));
        }, OPTIMIZATION_TIMEOUT);

        (async () => {
            try {
                // Get original dimensions
                const dimensions = await getImageDimensions(file);

                if (dimensions.width <= maxWidth && dimensions.height <= maxHeight && file.type !== 'image/jfif') {
                    cleanup();
                    return resolve(file);
                }

                // For JFIF files, always process to convert to JPEG
                if (file.type === 'image/jfif' && dimensions.width <= maxWidth && dimensions.height <= maxHeight) {
                    // Process without resizing to convert format only
                }

                const img = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    cleanup();
                    reject(new Error('Failed to get canvas context - browser may be out of memory'));
                    return;
                }

                img.onload = () => {
                    try {
                        const newDimensions = calculateNewDimensions(
                            img.width,
                            img.height,
                            maxWidth,
                            maxHeight
                        );

                        canvas.width = newDimensions.width;
                        canvas.height = newDimensions.height;

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, newDimensions.width, newDimensions.height);

                        canvas.toBlob(
                            (blob) => {
                                cleanup();

                                if (!blob) {
                                    reject(new Error('Failed to create blob - image may be too large'));
                                    return;
                                }

                                // Create filename with correct extension
                                const fileName = file.name.replace(/\.(jfif|jpg|jpeg)$/i, `.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`);

                                const optimizedFile = new File([blob], fileName, {
                                    type: `image/${outputFormat}`,
                                    lastModified: Date.now()
                                });

                                resolve(optimizedFile);
                            },
                            `image/${outputFormat}`,
                            quality
                        );
                    } catch (canvasError) {
                        cleanup();
                        reject(new Error(`Canvas operation failed: ${canvasError instanceof Error ? canvasError.message : 'Unknown error'}`));
                    }
                };

                img.onerror = () => {
                    cleanup();
                    reject(new Error('Failed to load image'));
                };

                imgUrl = URL.createObjectURL(file);
                img.src = imgUrl;
            } catch (error) {
                cleanup();
                reject(error);
            }
        })().catch((error) => {
            cleanup();
            reject(error);
        });
    });
};

/**
 * Extract MIME type from file name
 */
export const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        jfif: 'image/jfif',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        heic: 'image/heic'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/') ||
      getMimeType(file.name).startsWith('image/');
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
