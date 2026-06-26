/**
 * QR code generation composable.
 *
 * Hoisted out of `usePrintSheet.ts` (#380) so the report-print sheet and
 * the facility QR modal share a single dynamic-import path. The `qrcode`
 * package weighs ~33 KB and is irrelevant to most page loads, so it stays
 * out of the initial bundle. Both call sites now resolve via this
 * composable; if/when we add a third consumer (e.g. tracking-flyer
 * generator), it slots in here.
 *
 * Returns a data URL — callers decide whether to embed in an `<img>` tag,
 * a print sheet, or a download link.
 */

export interface GenerateQrCodeOptions {
    /**
     * Output width in pixels. Defaults to 76px (~20mm at 96dpi) which
     * matches the report-print sheet's existing footprint. Override for
     * larger surfaces — e.g. ~590px for a 5cm × 5cm sticker at 300 DPI
     * (the facility QR target per #380).
     */
    width?: number
    /** Quiet-zone margin in modules. Default 1 (the qrcode lib's minimum). */
    margin?: number
    /**
     * Error-correction level. `'M'` (default, ~15% recovery) is fine for
     * digital display. Use `'H'` (~30%) for printed stickers that may get
     * scuffed, partially covered, or photographed under poor lighting.
     */
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export function useQrCode() {
    /**
     * Generate a QR code as a PNG data URL.
     *
     * Returns an empty string on failure rather than throwing — every known
     * caller surfaces failure as a graceful "no QR shown" rather than as a
     * blocker. If you need throw-on-failure semantics, wrap accordingly.
     */
    async function generateQrCode(
        url: string,
        options: GenerateQrCodeOptions = {}
    ): Promise<string> {
        if (!url) return '';
        try {
            const QRCode = await import('qrcode');
            return await QRCode.toDataURL(url, {
                width: options.width ?? 76,
                margin: options.margin ?? 1,
                errorCorrectionLevel: options.errorCorrectionLevel ?? 'M'
            });
        } catch (e) {
            if (import.meta.dev) console.warn('[QrCode] Generation failed:', e);
            return '';
        }
    }

    return { generateQrCode };
}
