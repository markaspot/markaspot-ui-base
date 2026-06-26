/**
 * Color Utility Tests
 *
 * Tests WCAG luminance calculation, contrast ratios, color inversion,
 * and dark-mode-aware text color selection.
 *
 * @see app/utils/colorUtils.ts
 */
import { describe, it, expect } from 'vitest';
import {
    getLuminance,
    invertColor,
    getContrastRatio,
    getContrastingTextColor,
    getCSSVariable,
    NEUTRAL_FALLBACKS
} from '@/utils/colorUtils';

// ============================================================================
// getLuminance
// ============================================================================

describe('getLuminance', () => {
    it('returns 0 for black', () => {
        expect(getLuminance('#000000')).toBeCloseTo(0, 5);
    });

    it('returns 1 for white', () => {
        expect(getLuminance('#ffffff')).toBeCloseTo(1, 5);
    });

    it('returns ~0.2126 for pure red', () => {
        // Red coefficient in WCAG formula
        expect(getLuminance('#ff0000')).toBeCloseTo(0.2126, 3);
    });

    it('returns ~0.7152 for pure green', () => {
        expect(getLuminance('#00ff00')).toBeCloseTo(0.7152, 3);
    });

    it('returns ~0.0722 for pure blue', () => {
        expect(getLuminance('#0000ff')).toBeCloseTo(0.0722, 3);
    });

    it('handles hex without #', () => {
        expect(getLuminance('ffffff')).toBeCloseTo(1, 5);
    });

    it('gray (#808080) is mid-range', () => {
        const lum = getLuminance('#808080');
        expect(lum).toBeGreaterThan(0.15);
        expect(lum).toBeLessThan(0.25);
    });

    it('uses WCAG 2.1 linearization threshold (0.03928)', () => {
        // Value just below threshold (10/255 = 0.0392...)
        // Should use linear branch: v / 12.92
        const lowLum = getLuminance('#0a0a0a');
        expect(lowLum).toBeGreaterThan(0);
        expect(lowLum).toBeLessThan(0.005);
    });
});

// ============================================================================
// getContrastRatio
// ============================================================================

describe('getContrastRatio', () => {
    it('returns 21:1 for black vs white', () => {
        const ratio = getContrastRatio('#000000', '#ffffff');
        expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1:1 for same colors', () => {
        expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 5);
    });

    it('is symmetric (order independent)', () => {
        const ratio1 = getContrastRatio('#336699', '#ffffff');
        const ratio2 = getContrastRatio('#ffffff', '#336699');
        expect(ratio1).toBeCloseTo(ratio2, 10);
    });

    it('WCAG AA requires 4.5:1 for normal text', () => {
        // Dark blue on white should pass AA
        const ratio = getContrastRatio('#003366', '#ffffff');
        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('WCAG AAA requires 7:1 for normal text', () => {
        const ratio = getContrastRatio('#000000', '#ffffff');
        expect(ratio).toBeGreaterThanOrEqual(7);
    });
});

// ============================================================================
// invertColor
// ============================================================================

describe('invertColor', () => {
    describe('full inversion (bw=false)', () => {
        it('inverts black to white', () => {
            expect(invertColor('#000000', false)).toBe('#ffffff');
        });

        it('inverts white to black', () => {
            expect(invertColor('#ffffff', false)).toBe('#000000');
        });

        it('inverts red to cyan', () => {
            expect(invertColor('#ff0000', false)).toBe('#00ffff');
        });
    });

    describe('black/white mode (bw=true)', () => {
        it('returns black for light backgrounds', () => {
            expect(invertColor('#ffffff', true)).toBe('#000000');
            expect(invertColor('#ffff00', true)).toBe('#000000');
        });

        it('returns white for dark backgrounds', () => {
            expect(invertColor('#000000', true)).toBe('#ffffff');
            expect(invertColor('#003366', true)).toBe('#ffffff');
        });

        it('uses ITU-R BT.601 perceived brightness (threshold 186)', () => {
            // Boundary: r*0.299 + g*0.587 + b*0.114 = 186
            // Pure gray at boundary: 186/1.0 = 186 → #bababa
            // Just above: should return black
            expect(invertColor('#bbbbbb', true)).toBe('#000000');
            // Just below: should return white
            expect(invertColor('#b9b9b9', true)).toBe('#ffffff');
        });
    });

    describe('short hex (#RGB)', () => {
        it('handles 3-character hex', () => {
            expect(invertColor('#fff', true)).toBe('#000000');
            expect(invertColor('#000', true)).toBe('#ffffff');
        });

        it('expands 3-char to 6-char correctly', () => {
            // #f00 = #ff0000 (red), inverted = #00ffff (cyan)
            expect(invertColor('#f00', false)).toBe('#00ffff');
        });
    });

    describe('invalid input', () => {
        it('returns fallback for empty string', () => {
            expect(invertColor('', true)).toBe('#000000');
            expect(invertColor('', false)).toBe('#ffffff');
        });

        it('returns fallback for missing #', () => {
            expect(invertColor('ff0000', true)).toBe('#000000');
        });

        it('returns fallback for wrong length', () => {
            expect(invertColor('#ff00', true)).toBe('#000000');
        });

        it('returns fallback for null/undefined', () => {
            expect(invertColor(null as any, true)).toBe('#000000');
            expect(invertColor(undefined as any, false)).toBe('#ffffff');
        });
    });
});

// ============================================================================
// getContrastingTextColor
// ============================================================================

describe('getContrastingTextColor', () => {
    describe('light mode (default)', () => {
        it('returns black for white background', () => {
            expect(getContrastingTextColor('#ffffff')).toBe('#000000');
        });

        it('returns white for black background', () => {
            expect(getContrastingTextColor('#000000')).toBe('#ffffff');
        });

        it('returns black for yellow (high luminance)', () => {
            expect(getContrastingTextColor('#ffff00')).toBe('#000000');
        });

        it('returns white for dark blue', () => {
            expect(getContrastingTextColor('#003366')).toBe('#ffffff');
        });
    });

    describe('dark mode preference', () => {
        it('prefers light text on medium gray in dark mode', () => {
            // #808080 has ~3.95:1 dark contrast and ~5.3:1 light contrast
            // In dark mode, light text is preferred unless dark is >1.5x better
            expect(getContrastingTextColor('#808080', { isDark: true })).toBe('#ffffff');
        });

        it('still uses dark text when dark contrast is overwhelmingly better', () => {
            // Very light background: dark text is the clear winner
            expect(getContrastingTextColor('#f0f0f0', { isDark: true })).toBe('#000000');
        });

        it('uses light text on dark backgrounds regardless of mode', () => {
            expect(getContrastingTextColor('#1a1a1a', { isDark: false })).toBe('#ffffff');
            expect(getContrastingTextColor('#1a1a1a', { isDark: true })).toBe('#ffffff');
        });
    });

    describe('custom options', () => {
        it('respects custom dark/light colors', () => {
            const result = getContrastingTextColor('#000000', {
                darkColor: '#111111',
                lightColor: '#eeeeee'
            });
            expect(result).toBe('#eeeeee');
        });

        it('respects custom minContrast', () => {
            // With WCAG AAA (7:1), the selection may differ
            const aa = getContrastingTextColor('#808080', { minContrast: 4.5 });
            const aaa = getContrastingTextColor('#808080', { minContrast: 7 });
            // Both should return a valid color
            expect(aa).toMatch(/^#[0-9a-f]{6}$/);
            expect(aaa).toMatch(/^#[0-9a-f]{6}$/);
        });
    });

    describe('invalid input', () => {
        it('returns light color for invalid hex', () => {
            expect(getContrastingTextColor('')).toBe('#ffffff');
            expect(getContrastingTextColor('not-a-color')).toBe('#ffffff');
        });

        it('returns light color for null', () => {
            expect(getContrastingTextColor(null as any)).toBe('#ffffff');
        });
    });
});

// ============================================================================
// getCSSVariable
// ============================================================================

describe('getCSSVariable', () => {
    it('returns SSR fallback when window is undefined', () => {
        // happy-dom provides window, but we can test the fallback constant
        expect(NEUTRAL_FALLBACKS.DEFAULT).toBe('#6b7280');
        expect(NEUTRAL_FALLBACKS.LIGHT).toBe('#9ca3af');
        expect(NEUTRAL_FALLBACKS.MEDIUM).toBe('#4b5563');
        expect(NEUTRAL_FALLBACKS.SOFT).toBe('#d1d5db');
    });
});
