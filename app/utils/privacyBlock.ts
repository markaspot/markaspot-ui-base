/**
 * Pure decision helpers for the AI privacy hard-block (#473).
 *
 * The block (tenant flag `features.privacyBlockOnFlag` + an active no-blur
 * privacy warning) is enforced belt-and-suspenders in three places so no single
 * "simplification" can reopen a bypass:
 *   1. submit button `:disabled`           (blocks the mouse path)
 *   2. `canSubmit` (useFormValidation)      (gates the sticky footer)
 *   3. `getValidationErrors`                (blocks the keyboard/Enter native
 *                                            submit path: Enter in a text field
 *                                            fires @submit.prevent -> handleSubmit
 *                                            -> getValidationErrors)
 *
 * Helpers 2/3 live here so they are unit-testable without mounting the whole
 * PhotoReportForm (map + a dozen composables).
 */

export interface ValidationError {
    status: string
    title: string
    detail: string
}

/**
 * The validation error to surface while the privacy block is active, or null.
 *
 * `detailText` is the already-translated `report.ai.privacy.required` string;
 * keeping translation in the caller leaves this helper pure and i18n-agnostic.
 */
export function privacyBlockValidationError(
    privacyBlocked: boolean,
    detailText: string
): ValidationError | null {
    if (!privacyBlocked) return null;
    return {
        status: '400',
        title: 'Validation Error',
        detail: detailText
    };
}

/**
 * Whether dismissing the AI privacy warning is allowed.
 *
 * When the tenant hard-blocks (`privacyBlockEnabled`), dismissal must be a
 * no-op: the banner already hides the "continue" button, and this closes the
 * programmatic path so a synthetic `dismiss-privacy` event cannot clear the
 * block. The only resolutions are replacing or removing the photo.
 */
export function canDismissPrivacyWarning(privacyBlockEnabled: boolean): boolean {
    return !privacyBlockEnabled;
}
