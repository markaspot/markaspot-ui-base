/**
 * Splash Screen PNG Generator
 *
 * Renders branded splash screen PNGs from SVG templates using resvg (WASM).
 * Pure functions, no side effects, no network calls.
 *
 * The SVG uses a solid dark background (neutral-950) with the tenant logo
 * centered at 20% of the smaller dimension. This ensures any logo color
 * contrasts well against the dark background.
 */
import { Resvg } from '@resvg/resvg-js';

/**
 * Generate a splash screen PNG.
 *
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @param bgColor - Background hex color (e.g. '#020617')
 * @param logoData - Logo buffer + content type, or null for solid color fallback
 * @returns PNG buffer
 */
export async function generateSplashPng(
    width: number,
    height: number,
    bgColor: string,
    logoData: { buffer: Buffer, contentType: string } | null
): Promise<Buffer> {
    // Defense-in-depth: sanitize bgColor to prevent SVG injection
    if (!/^#[0-9a-fA-F]{3,6}$/.test(bgColor)) bgColor = '#020617';

    let logoElement = '';

    if (logoData) {
        const b64 = logoData.buffer.toString('base64');
        // Allowlist content types to prevent data URI injection (strip charset etc.)
        const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']);
        const rawType = logoData.contentType.split(';')[0].trim().toLowerCase();
        const safeType = allowedTypes.has(rawType) ? rawType : 'image/png';
        const dataUri = `data:${safeType};base64,${b64}`;

        // Logo sized to 20% of the smaller dimension, centered
        const logoSize = Math.round(Math.min(width, height) * 0.2);
        const x = Math.round((width - logoSize) / 2);
        const y = Math.round((height - logoSize) / 2);

        logoElement = `<image href="${dataUri}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect fill="${bgColor}" width="100%" height="100%"/>
  ${logoElement}
</svg>`;

    const resvg = new Resvg(svg, {
        fitTo: { mode: 'original' }
    });
    const rendered = resvg.render();
    return Buffer.from(rendered.asPng());
}

/**
 * Compute a deterministic short hash from splash render inputs.
 *
 * Uses the same algorithm on both server (this file) and client
 * (app/utils/colorPalette.ts) to ensure URL hashes match.
 *
 * @returns 6-char base36 hash
 */
export function computeSplashHash(neutralHex: string, primaryHex: string, logoPath: string): string {
    let h = 0;
    const s = `${neutralHex}-${primaryHex}-${logoPath}`;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0; // Convert to 32-bit integer
    }
    return (h >>> 0).toString(36).padStart(6, '0').slice(0, 6);
}
