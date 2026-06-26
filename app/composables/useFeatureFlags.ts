import { useMarkASpotConfig } from '~/composables/core/useMarkASpotConfig';

/**
 * Feature Flags Composable
 *
 * Provides reactive access to client configuration feature flags.
 * Centralizes feature checks to ensure consistency across the app.
 *
 * Uses useMarkASpotConfig().clientConfig which normalizes backend API values
 * (e.g., `dashboard: true` → `dashboard: { enabled: true }`).
 *
 * IMPORTANT: Commercial features (offline, dashboard, operator AI) check BOTH:
 * 1. The Drupal config value (features.offline.enabled)
 * 2. Whether the pro layer is loaded (runtimeConfig.public.pro)
 *
 * This prevents crashes when config enables a feature but the code is missing
 * (e.g., MIT builds without pro layer).
 *
 * Usage:
 * const { passwordlessEnabled, statisticsEnabled } = useFeatureFlags();
 */
export const useFeatureFlags = () => {
    const { clientConfig } = useMarkASpotConfig();
    const runtimeConfig = useRuntimeConfig();

    // Check if pro layer is loaded
    // This is set in nuxt.config.ts based on NUXT_PRO env and layer existence
    const proAvailable = computed(() =>
        runtimeConfig.public.pro !== false
    );

    /**
     * Helper to check if a feature is enabled.
     * Supports both formats:
     * - Boolean: `feature: true`
     * - Object: `feature: { enabled: true }`
     */
    const isFeatureEnabled = (feature: unknown): boolean => {
        if (typeof feature === 'boolean') return feature;
        if (typeof feature === 'object' && feature !== null && 'enabled' in feature) {
            return Boolean((feature as { enabled: unknown }).enabled);
        }
        return false;
    };

    // Passwordless authentication (2.x feature).
    // Legacy or migrated tenants may not have seeded this key yet, but the
    // login flow should remain available unless it was explicitly disabled.
    const passwordlessEnabled = computed(() => {
        const flag = clientConfig.value?.features?.passwordless;
        if (flag === undefined || flag === null) return true;
        return isFeatureEnabled(flag);
    });

    // Statistics feature
    const statisticsEnabled = computed(() =>
        isFeatureEnabled(clientConfig.value?.features?.statistics)
    );

    // Photo Report entry point. The OSS code can ship in base, but the
    // photo-first Vision flow is opt-in per tenant.
    const photoReportingEnabled = computed(() => {
        const flag = clientConfig.value?.features?.photoReporting ??
          runtimeConfig.public.clientConfig?.features?.photoReporting;
        return isFeatureEnabled(flag);
    });

    // Feedback feature
    const feedbackEnabled = computed(() =>
        isFeatureEnabled(clientConfig.value?.features?.feedback)
    );

    // AI/Vision feature from the OSS markaspot_vision backend module.
    const aiAnalysisEnabled = computed(() => {
        const flag = clientConfig.value?.features?.aiAnalysis;
        if (flag === undefined || flag === null) return true;
        return isFeatureEnabled(flag);
    });

    // Photo Report is the photo-first AI/Vision flow. Classic media upload is
    // intentionally separate and remains available without AI.
    const photoReportAvailable = computed(() =>
        photoReportingEnabled.value && aiAnalysisEnabled.value
    );

    // AI Processing feature (PRO - requires pro layer).
    // Per-jurisdiction GDPR opt-in that backs the dashboard AI form-assist
    // actions (/api/ai/assist, /ai/attributes/fill, /ai/attributes/describe).
    // Fails closed when absent, mirroring the backend gate.
    const aiProcessingEnabled = computed(() =>
        proAvailable.value && isFeatureEnabled(clientConfig.value?.features?.aiProcessing)
    );

    // AI Duplicate Detection feature (PRO). Requires both the pro layer
    // and features.aiDuplicates = true from the settings endpoint.
    // The backend sets features.aiDuplicates = false when markaspot_ai is absent
    // or when duplicate_detection.enabled is false in markaspot_ai.settings,
    // keeping this distinct from aiAnalysis (markaspot_vision).
    const aiDuplicatesEnabled = computed(() =>
        proAvailable.value && isFeatureEnabled(clientConfig.value?.features?.aiDuplicates)
    );

    // AI analysis available (enabled AND budget not exhausted).
    // Inlined to avoid importing the budget composable in every feature-flag consumer.
    const { jurisdiction } = useMarkASpotConfig();
    const aiAnalysisAvailable = computed(() => {
        if (!aiAnalysisEnabled.value) return false;
        const budget = jurisdiction.value?.ai_budget;
        if (!budget) return true;
        if ((budget.remaining ?? -1) === -1) return true;
        return (budget.remaining ?? 0) > 0;
    });

    // Internal process feature for status transition attributes.
    // Operator-controlled only: tenant-admin feature settings must not expose
    // this flag, but the dashboard can render enabled tenants.
    const statusAttributesEnabled = computed(() =>
        proAvailable.value && isFeatureEnabled(clientConfig.value?.features?.statusAttributes)
    );

    // Intake source / inbound-email channel (#467). Set only when the backend
    // ships the `field_source` field (markaspot_mail_inbound module). It gates
    // the dashboard source COLUMN and FILTER: the JSON:API filter
    // `filter[field_source]` returns a hard 400 ("field does not exist") on
    // tenants without the field, so the filter must never be emitted unless this
    // flag is on. Fails closed (off when absent) so legacy tenants keep working.
    // The sparse-fieldset entry stays unconditional in the read composable:
    // Drupal silently ignores an unknown field in `fields[...]` (verified live),
    // so requesting it is harmless and the normalizer maps a missing value to web.
    const intakeSourceEnabled = computed(() =>
        proAvailable.value && isFeatureEnabled(clientConfig.value?.features?.intakeSource)
    );

    // Boundaries feature
    const boundariesEnabled = computed(() =>
        isFeatureEnabled(clientConfig.value?.features?.boundaries)
    );

    // Privacy notice modal/banner (UI display). Canonical path:
    // features.privacyNotice.enabled. Pure UI surface that toggles whether
    // the disclosure modal/link is rendered. Decoupled from the GDPR consent
    // requirement on the report form: that lives in fields.field_gdpr.required
    // and is gated independently in useFormValidation.
    // Default true (fail-closed for the visible disclosure).
    const privacyNoticeEnabled = computed(() => {
        const flag = clientConfig.value?.features?.privacyNotice;
        if (flag === undefined || flag === null) return true;
        return isFeatureEnabled(flag);
    });

    // Privacy notice display mode + policy link target. Centralizes the direct
    // clientConfig reads that previously lived in PrivacyNotice.vue (#323).
    const privacyNoticeModal = computed(() =>
        (clientConfig.value?.features?.privacyNotice as { modal?: boolean } | undefined)?.modal === true
    );
    const privacyNoticeLink = computed(() =>
        (clientConfig.value?.features?.privacyNotice as { link?: string } | undefined)?.link
    );

    // Fun facts on success page. Schema default is false.
    const funFactsEnabled = computed(() =>
        isFeatureEnabled(clientConfig.value?.features?.funFacts)
    );

    // Emergency mode (redirects to /lite when backend flag is set).
    // Enforcement lives in the emergency.global.ts middleware; this getter
    // is exposed for components that need to show an indicator badge.
    const emergencyEnabled = computed(() =>
        isFeatureEnabled(clientConfig.value?.features?.emergency)
    );

    // Dashboard feature (PRO - requires pro layer)
    const dashboardEnabled = computed(() =>
        proAvailable.value && isFeatureEnabled(clientConfig.value?.features?.dashboard)
    );

    // Offline mode feature (PRO - requires pro layer)
    const offlineEnabled = computed(() =>
        proAvailable.value && isFeatureEnabled(clientConfig.value?.features?.offline)
    );

    // Offline config (for composables that need the full config)
    const offlineConfig = computed(() =>
        clientConfig.value?.features?.offline
    );

    // Organisations feature (PRO - requires pro layer)
    // Default: true in pro-layer (standard municipal feature), opt-in in FastMap
    const organisationsEnabled = computed(() => {
        if (!proAvailable.value) return false;
        const flag = clientConfig.value?.features?.organisations;
        // Explicit config takes precedence
        if (flag !== undefined && flag !== null) return isFeatureEnabled(flag);
        // No config: default true for pro-layer, false for FastMap
        return !runtimeConfig.public.fastmap;
    });

    // Service providers feature (PRO - requires pro layer)
    // Default: true in pro-layer (standard municipal feature), opt-in in FastMap
    const serviceProvidersEnabled = computed(() => {
        if (!proAvailable.value) return false;
        const flag = clientConfig.value?.features?.serviceProviders;
        if (flag !== undefined && flag !== null) return isFeatureEnabled(flag);
        return !runtimeConfig.public.fastmap;
    });

    // Moderation (flag/report button). Default: true when not explicitly set.
    const moderationEnabled = computed(() => {
        const val = clientConfig.value?.features?.moderation;
        if (val === undefined || val === null) return true;
        return isFeatureEnabled(val);
    });

    // Privacy hard-block (#473). When true, an active AI privacy warning (only
    // raised in the no-blur fallback) blocks the report: the citizen cannot
    // continue with the flagged photo and must replace it before submitting.
    // Default false, so behavior is unchanged fleet-wide unless opted in.
    const privacyBlockEnabled = computed(() =>
        isFeatureEnabled(clientConfig.value?.features?.privacyBlockOnFlag)
    );

    // Email intake triage inbox (#482, PRO - requires pro layer). Surfaces the
    // staged inbound-mail inbox in the dashboard. Default false: the inbox is
    // hidden fleet-wide unless a tenant explicitly opts in (features.emailIntake)
    // and the inbound-mail backend is present. Mirrors the backend gate.
    const emailIntakeEnabled = computed(() =>
        proAvailable.value && isFeatureEnabled(clientConfig.value?.features?.emailIntake)
    );

    // Staff-created dashboard requests (#479). Default true for existing Pro
    // dashboards, with an explicit tenant off-switch via features.dashboardRequestCreate=false.
    const dashboardRequestCreateEnabled = computed(() => {
        if (!proAvailable.value) return false;
        const flag = clientConfig.value?.features?.dashboardRequestCreate;
        if (flag === undefined || flag === null) return true;
        return isFeatureEnabled(flag);
    });

    return {
        // Pro layer availability
        proAvailable,

        // Auth features
        passwordlessEnabled,

        // Core features
        statisticsEnabled,
        photoReportingEnabled,
        photoReportAvailable,
        feedbackEnabled,
        boundariesEnabled,
        privacyNoticeEnabled,
        privacyNoticeModal,
        privacyNoticeLink,
        funFactsEnabled,
        emergencyEnabled,

        // Pro features (require pro layer)
        aiAnalysisEnabled,
        aiAnalysisAvailable,
        aiProcessingEnabled,
        aiDuplicatesEnabled,
        statusAttributesEnabled,
        intakeSourceEnabled,
        dashboardEnabled,
        offlineEnabled,
        offlineConfig,
        organisationsEnabled,
        serviceProvidersEnabled,
        moderationEnabled,
        privacyBlockEnabled,
        emailIntakeEnabled,
        dashboardRequestCreateEnabled
    };
};
