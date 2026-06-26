/**
 * AI Budget Composable
 *
 * Provides reactive AI analysis budget state derived from the jurisdiction
 * configuration. Used by analysis consumers to gate AI calls when budget is
 * exhausted, and by dashboard widgets to display usage.
 *
 * Budget data comes from the backend via useMarkASpotConfig().jurisdiction.ai_budget.
 * When no ai_budget is present (on-premise or no tier), all checks return
 * permissive defaults (unlimited, not exhausted).
 *
 * Optimistic updates use a shared useState override so all consumers
 * (photo analysis, useFeatureFlags, dashboard widget) see the same state.
 */
export function useAIBudget() {
    const { jurisdiction } = useMarkASpotConfig();

    // Shared optimistic override across all useAIBudget() instances.
    // Reset to null on next config refresh from backend.
    const localOverride = useState<{ used: number, remaining: number } | null>(
        'ai-budget-override',
        () => null
    );

    /** Monthly AI analysis limit. 0 when no budget configured. */
    const aiBudgetLimit = computed(() =>
        jurisdiction.value?.ai_budget?.limit ?? 0
    );

    /** Number of AI analyses used this billing period. */
    const aiBudgetUsed = computed(() =>
        localOverride.value?.used ?? jurisdiction.value?.ai_budget?.used ?? 0
    );

    /** Remaining analyses. -1 means unlimited. */
    const aiBudgetRemaining = computed(() =>
        localOverride.value?.remaining ?? jurisdiction.value?.ai_budget?.remaining ?? -1
    );

    /** True when remaining is -1 (partner/enterprise/on-premise). */
    const isAIBudgetUnlimited = computed(() =>
        aiBudgetRemaining.value === -1
    );

    /** True when budget exists and is fully consumed. */
    const isAIBudgetExhausted = computed(() => {
        // No budget data = no restriction (on-premise / no tier)
        if (!jurisdiction.value?.ai_budget) return false;
        // Unlimited tiers are never exhausted
        if (isAIBudgetUnlimited.value) return false;
        return aiBudgetRemaining.value <= 0;
    });

    /** Percentage of budget used (0-100). 0 when unlimited or no budget. */
    const aiBudgetPercentUsed = computed(() => {
        if (isAIBudgetUnlimited.value || aiBudgetLimit.value <= 0) return 0;
        return Math.min(100, Math.round((aiBudgetUsed.value / aiBudgetLimit.value) * 100));
    });

    /**
     * Optimistic local update after a successful AI analysis.
     * Increments the used counter and decrements remaining without
     * waiting for the next backend refresh. Uses shared useState
     * so all consumers see the update immediately.
     */
    const incrementUsage = () => {
        const budget = jurisdiction.value?.ai_budget;
        if (!budget || isAIBudgetUnlimited.value) return;

        const currentUsed = localOverride.value?.used ?? budget.used ?? 0;
        const currentRemaining = localOverride.value?.remaining ?? budget.remaining ?? 0;

        localOverride.value = {
            used: currentUsed + 1,
            remaining: Math.max(0, currentRemaining - 1)
        };
    };

    return {
        aiBudgetLimit,
        aiBudgetUsed,
        aiBudgetRemaining,
        isAIBudgetExhausted,
        isAIBudgetUnlimited,
        aiBudgetPercentUsed,
        incrementUsage
    };
}
