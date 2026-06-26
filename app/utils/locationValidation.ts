/**
 * Location validation policy (single source of truth).
 *
 * Decided 2026-05-22: reporting is gated ONLY by the boundary check. A missing
 * postal code — or a point the reverse geocoder returned no address for at all —
 * must NEVER block the report flow. Such points are common (intersections,
 * parks, water edges) and entire regions return no postcode (e.g. large parts of
 * Africa, several FastMap/CivicSpot tenants), yet the coordinates are a perfectly
 * valid report location. We fall back to coordinates and send an empty
 * `postal_code` (Drupal accepts this; see utils/mapAddressToDrupal.ts).
 *
 * Historically a missing postcode was forced to `hardInvalid: true`, which
 * bypassed the boundary `strictValidation` flag and hard-blocked the tooltip
 * "Confirm location" / "Report" actions AND the form submit. That is the bug
 * this module removes.
 *
 * Regression guard: `resolveLocationValidation` intentionally takes ONLY the
 * boundary result and no postcode/address input, so the "no postcode ->
 * hardInvalid -> blocked" behavior cannot creep back in through this path.
 */

export interface BoundaryValidationResult {
    valid: boolean
    message: string
    /** Legacy field; never honored as a blocker anymore. */
    hardInvalid?: boolean
}

export interface LocationValidationState {
    valid: boolean
    message: string
    /**
     * Always `false`. Kept in the shape because several consumers still read it;
     * a missing postcode/address must never hard-block (coordinate fallback).
     */
    hardInvalid: boolean
}

/**
 * Resolve the tooltip/form location validation state from the boundary result.
 *
 * Only the boundary check decides validity. The postcode is deliberately not an
 * input here — see the module docblock.
 */
export function resolveLocationValidation(
    boundary: BoundaryValidationResult
): LocationValidationState {
    return {
        valid: boundary.valid,
        message: boundary.message,
        hardInvalid: false
    };
}
