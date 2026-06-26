/**
 * Print composable for service requests.
 *
 * Shared between the citizen detail modal and the dashboard request pages.
 * Handles map canvas capture (with OSM static tile fallback), QR code
 * generation, and the print workflow. All browser APIs (window, document)
 * are only touched from click handlers (client-only).
 */
import { useQrCode } from './useQrCode';

export function usePrintSheet() {
    const mapImageUrl = ref<string | null>(null);
    const qrCodeUrl = ref<string>('');
    const isPreparing = ref(false);

    /**
     * Try to capture MapLibre canvas as a PNG data URL.
     * Usually fails due to CORS-tainted canvas (external tile servers).
     * Fast fail: one attempt, no retry.
     */
    function captureMapCanvas(mapElement: HTMLElement | null): string | null {
        if (!mapElement) return null;
        const canvas = mapElement.querySelector('canvas');
        if (!canvas) return null;
        try {
            const dataUrl = canvas.toDataURL('image/png');
            // Blank canvases produce tiny data URLs
            if (dataUrl.length < 4000) return null;
            return dataUrl;
        } catch {
            return null;
        }
    }

    /**
     * Build a static map image URL using OpenStreetMap tiles.
     * Reliable fallback: regular <img> tag, no WebGL/CORS issues.
     */
    function buildStaticMapUrl(lat: number, lon: number, zoom = 16): string {
        const n = Math.pow(2, zoom);
        const x = Math.floor(((lon + 180) / 360) * n);
        const latRad = (lat * Math.PI) / 180;
        const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
        return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    }

    /**
     * Generate a QR code as a PNG data URL.
     *
     * Delegates to the shared `useQrCode` composable so the dynamic-import
     * path for the `qrcode` package is single-sourced (#380). Width stays
     * at 76px (~20mm @ 96dpi) for the report-print sheet's existing
     * footprint; the facility-sticker variant calls useQrCode() directly
     * with a larger width.
     */
    const { generateQrCode: generateQrCodeShared } = useQrCode();
    function generateQrCode(url: string): Promise<string> {
        return generateQrCodeShared(url, { width: 76, margin: 1, errorCorrectionLevel: 'M' });
    }

    /**
     * Wait for all images inside the teleported print sheet to finish loading.
     * The sheet is rendered via <Teleport to="body">, so template refs on the
     * wrapper div are empty — we query the document by data-attribute instead.
     * Returns after all load or after a 3s timeout.
     */
    function waitForSheetImages(): Promise<void> {
        if (typeof document === 'undefined') return Promise.resolve();
        const sheet = document.querySelector('[data-print-sheet]');
        if (!sheet) return Promise.resolve();

        const images = Array.from(sheet.querySelectorAll('img'));
        if (images.length === 0) return Promise.resolve();

        const promises = images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
        });

        return Promise.race([
            Promise.all(promises).then(() => {}),
            new Promise<void>(resolve => setTimeout(resolve, 3000))
        ]);
    }

    /**
     * Full print workflow:
     * 1. Capture the map canvas (dashboard path) or fall back to static OSM tile
     * 2. Generate QR code for the current URL
     * 3. Wait for photos in the teleported sheet to load
     * 4. Trigger window.print()
     * 5. Free data URL memory
     *
     * Re-entry guard: aborts if another print is already in progress, so
     * rapid double-clicks on the trigger button don't stack workflows.
     */
    async function printRequest(
        mapElement: HTMLElement | null,
        location?: { lat: number, lon: number } | null
    ): Promise<void> {
        if (isPreparing.value) return;
        isPreparing.value = true;

        try {
            // Try WebGL canvas capture (usually fails due to CORS-tainted canvas).
            // Only wired in the dashboard; citizen path passes null and hits OSM.
            mapImageUrl.value = captureMapCanvas(mapElement);

            // Fallback: static OSM tile (reliable, works as regular <img>).
            if (!mapImageUrl.value && location?.lat != null && location?.lon != null &&
              Number.isFinite(location.lat) && Number.isFinite(location.lon)) {
                mapImageUrl.value = buildStaticMapUrl(location.lat, location.lon);
            }

            // Generate QR code
            qrCodeUrl.value = await generateQrCode(window.location.href);

            // Let Vue render the print component with new data
            await nextTick();

            // Wait for photos in the teleported sheet to load.
            await waitForSheetImages();

            // Small delay for final render
            await new Promise(resolve => setTimeout(resolve, 100));

            window.print();
        } finally {
            isPreparing.value = false;
            // Free large data URL strings after print dialog closes
            mapImageUrl.value = null;
            qrCodeUrl.value = '';
        }
    }

    return { mapImageUrl, qrCodeUrl, isPreparing, printRequest };
}
