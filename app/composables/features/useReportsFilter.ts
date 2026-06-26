import { useI18n } from 'vue-i18n';
import { useRuntimeConfig } from '#imports';
import type { Request } from '~~/types';
import { getReportStatusInfo } from '@/utils/reportUtils';

/**
 * Reports Filter Composable
 *
 * Manages filter state and logic for reports list.
 * Uses actual store data, status colors, and i18n translations.
 *
 * PERFORMANCE: This composable uses memoization and separated computeds
 * to prevent expensive recalculations on every filter toggle.
 */

export interface FilterOption {
    id: string
    label: string
    icon: string
    count?: number
    color?: string
    active: boolean
}

export interface FilterGroup {
    id: string
    label: string
    options: FilterOption[]
    multiSelect?: boolean
}

export function useReportsFilter(
    requests: Ref<Request[]> | Ref<readonly Request[]>,
    optionsSource?: Ref<Request[]> | Ref<readonly Request[]>
) {
    // PERFORMANCE: WeakMap cache for status info - INSIDE function to prevent SSR memory leak
    // Moving from module scope ensures cache is garbage collected per composable instance
    const statusInfoCache = new WeakMap<Request, ReturnType<typeof getReportStatusInfo>>();

    function getCachedStatusInfo(request: Request) {
        let cached = statusInfoCache.get(request);
        if (!cached) {
            cached = getReportStatusInfo(request);
            statusInfoCache.set(request, cached);
        }
        return cached;
    }

    const { t } = useI18n();
    const runtimeConfig = useRuntimeConfig();
    const { clientConfig } = useMarkASpotConfig();

    // Use optionsSource for building filter options, or fall back to requests
    const dataForOptions = optionsSource || requests;

    // Get filter configuration - dynamic config from API takes priority
    const filterConfig = computed(() =>
        clientConfig.value?.features?.filters ||
        runtimeConfig.public.clientConfig?.features?.filters
    );

    // Filter state - use shallowRef for better performance
    const activeFilters = ref<Set<string>>(new Set());
    const isFilterExpanded = ref(false);
    const showAllCategories = ref(false); // Expand "Other" to show all categories

    // PERFORMANCE: Separate the base data aggregation from active state
    // This computed only recalculates when the DATA changes, not when filters toggle
    const baseFilterData = computed(() => {
        const requestsValue = dataForOptions.value || [];

        // Aggregate status data in a single pass
        const statusData: Record<string, {
            count: number
            descriptive_name: string
            hex?: string
            color: string
            original_status?: string
        }> = {};

        // Aggregate category data in a single pass
        const categoryData: Record<string, number> = {};

        // Single pass through all requests
        for (const request of requestsValue) {
            // Status aggregation using cached status info
            const statusInfo = getCachedStatusInfo(request);
            const statusHex = statusInfo.statusHex;

            if (!statusData[statusInfo.filterKey]) {
                statusData[statusInfo.filterKey] = {
                    count: 0,
                    descriptive_name: statusInfo.statusDescriptive,
                    hex: statusHex,
                    color: statusHex,
                    original_status: statusInfo.currentStatus
                };
            }
            statusData[statusInfo.filterKey].count++;

            // Category aggregation
            const service = request.service_name || t('filters.category.other');
            categoryData[service] = (categoryData[service] || 0) + 1;
        }

        return { statusData, categoryData, total: requestsValue.length };
    });

    // PERFORMANCE: Build filter groups using pre-aggregated data
    // Only depends on baseFilterData and activeFilters
    const filterGroups = computed((): FilterGroup[] => {
        const { statusData, categoryData } = baseFilterData.value;
        const groups: FilterGroup[] = [];

        // Add status filters if enabled (default: true if not specified)
        if (filterConfig.value?.enabled?.status !== false) {
            groups.push({
                id: 'status',
                label: t('filters.status.title'),
                multiSelect: false,
                options: Object.entries(statusData).map(([filterKey, data]) => ({
                    id: `status:${filterKey}`,
                    label: data.descriptive_name,
                    icon: data.original_status === 'open'
                        ? 'i-heroicons-exclamation-circle'
                        : data.original_status === 'closed' ? 'i-heroicons-check-circle' : 'i-heroicons-clock',
                    count: data.count,
                    color: data.color,
                    active: activeFilters.value.has(`status:${filterKey}`)
                }))
            });
        }

        // Add time filters if enabled (default: true if not specified)
        if (filterConfig.value?.enabled?.time !== false) {
            groups.push({
                id: 'time',
                label: t('filters.time.title'),
                multiSelect: false,
                options: [
                    {
                        id: 'time:today',
                        label: t('filters.time.today'),
                        icon: 'i-heroicons-calendar-days',
                        active: activeFilters.value.has('time:today')
                    },
                    {
                        id: 'time:week',
                        label: t('filters.time.week'),
                        icon: 'i-heroicons-calendar',
                        active: activeFilters.value.has('time:week')
                    },
                    {
                        id: 'time:month',
                        label: t('filters.time.month'),
                        icon: 'i-heroicons-calendar',
                        active: activeFilters.value.has('time:month')
                    }
                ]
            });
        }

        // Add category filters if enabled (default: true if not specified)
        if (filterConfig.value?.enabled?.category !== false) {
            const sortedCategories = Object.entries(categoryData)
                .sort(([, a], [, b]) => (b as number) - (a as number));

            let categoryOptions: FilterOption[];

            if (showAllCategories.value || sortedCategories.length <= 5) {
                categoryOptions = sortedCategories.map(([service, count]) => ({
                    id: `category:${service}`,
                    label: service,
                    icon: 'i-heroicons-tag',
                    count: count as number,
                    color: 'gray',
                    active: activeFilters.value.has(`category:${service}`)
                }));
            } else {
                const topCategories = sortedCategories.slice(0, 5);
                const otherCategories = sortedCategories.slice(5);
                const otherCount = otherCategories.reduce((sum, [, count]) => sum + (count as number), 0);

                categoryOptions = topCategories.map(([service, count]) => ({
                    id: `category:${service}`,
                    label: service,
                    icon: 'i-heroicons-tag',
                    count: count as number,
                    color: 'gray',
                    active: activeFilters.value.has(`category:${service}`)
                }));

                if (otherCount > 0) {
                    categoryOptions.push({
                        id: 'category:__show_more__',
                        label: t('filters.category.other'),
                        icon: 'i-heroicons-ellipsis-horizontal',
                        count: otherCount,
                        color: 'gray',
                        active: false
                    });
                }
            }

            groups.push({
                id: 'category',
                label: t('filters.category.title'),
                multiSelect: false,
                options: categoryOptions
            });
        }

        return groups;
    });

    // Get all filters organized by type
    const allFiltersByType = computed(() => {
        const statusGroup = filterGroups.value.find(g => g.id === 'status');
        const timeGroup = filterGroups.value.find(g => g.id === 'time');
        const categoryGroup = filterGroups.value.find(g => g.id === 'category');

        return {
            status: statusGroup?.options || [],
            time: timeGroup?.options || [],
            category: categoryGroup?.options || []
        };
    });

    // Primary filters: Configurable or default logic
    const primaryFilters = computed(() => {
        const filters = allFiltersByType.value;
        const result = [];

        // Check if filters are configured, otherwise use default logic
        const primaryGroups: string[] = filterConfig.value?.groups?.primary || ['status:*'];

        // 1. Add ALL active filters first (they always go to primary)
        const allActive = [
            ...filters.status.filter(f => f.active),
            ...filters.time.filter(f => f.active),
            ...filters.category.filter(f => f.active)
        ];
        result.push(...allActive);

        // 2. Apply configured primary groups or defaults
        if (primaryGroups.includes('status:*') || primaryGroups.some(g => g.startsWith('status:'))) {
            // Add inactive status filters (always important)
            const inactiveStatus = filters.status.filter(f => !f.active);
            result.push(...inactiveStatus);
        }

        if (primaryGroups.includes('time:*') || primaryGroups.some(g => g.startsWith('time:'))) {
            // Add first 2 time filters if not already included
            const defaultTime = filters.time.slice(0, 2); // "Heute", "Diese Woche"
            defaultTime.forEach((filter) => {
                if (!result.find(r => r.id === filter.id)) {
                    result.push(filter);
                }
            });
        }

        return result;
    });

    // Secondary filters: Everything else not in primary (configurable)
    const secondaryFilters = computed(() => {
        const filters = allFiltersByType.value;
        const primaryIds = new Set(primaryFilters.value.map(f => f.id));
        const secondaryGroups: string[] = filterConfig.value?.groups?.secondary || ['category:*', 'time:*'];

        const remaining = [];

        // Add filters based on secondary groups configuration
        if (secondaryGroups.includes('time:*') || secondaryGroups.some(g => g.startsWith('time:'))) {
            // Add remaining time filters (after first 2)
            filters.time.forEach((filter) => {
                if (!primaryIds.has(filter.id)) {
                    remaining.push(filter);
                }
            });
        }

        if (secondaryGroups.includes('category:*') || secondaryGroups.some(g => g.startsWith('category:'))) {
            // Add all category filters not in primary
            filters.category.forEach((filter) => {
                if (!primaryIds.has(filter.id)) {
                    remaining.push(filter);
                }
            });
        }

        return remaining;
    });

    // PERFORMANCE: Pre-compute filter arrays to avoid repeated parsing
    const parsedFilters = computed(() => {
        const filters = Array.from(activeFilters.value);
        return {
            status: filters.filter(f => f.startsWith('status:')),
            time: filters.filter(f => f.startsWith('time:')),
            category: filters.filter(f => f.startsWith('category:'))
        };
    });

    // Filter requests based on active filters
    const filteredRequests = computed(() => {
        const filtered = requests.value || [];

        if (activeFilters.value.size === 0) {
            return filtered;
        }

        const { status: statusFilters, time: timeFilters, category: categoryFilters } = parsedFilters.value;

        // Use a single filter pass for better performance
        return filtered.filter((request) => {
            // Check status filter
            if (statusFilters.length > 0) {
                const statusInfo = getCachedStatusInfo(request);
                const matchesStatus = statusFilters.some(filter => filter === `status:${statusInfo.filterKey}`);
                if (!matchesStatus) return false;
            }

            // Check time filter
            if (timeFilters.length > 0) {
                const requestDate = new Date(request.requested_datetime);
                const now = new Date();

                const matchesTime = timeFilters.some((filter) => {
                    switch (filter) {
                        case 'time:today':
                            return requestDate.toDateString() === now.toDateString();
                        case 'time:week': {
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            return requestDate >= weekAgo;
                        }
                        case 'time:month': {
                            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            return requestDate >= monthAgo;
                        }
                        default:
                            return true;
                    }
                });
                if (!matchesTime) return false;
            }

            // Check category filter
            if (categoryFilters.length > 0) {
                const category = request.service_name || t('filters.category.other');
                const matchesCategory = categoryFilters.some(filter => filter === `category:${category}`);
                if (!matchesCategory) return false;
            }

            return true;
        });
    });

    // Actions
    const toggleFilter = (filterId: string) => {
        // Handle "Show More" button for categories
        if (filterId === 'category:__show_more__') {
            showAllCategories.value = true;
            return;
        }

        // PERFORMANCE: Determine filter type from the ID directly instead of searching filterGroups
        const filterType = filterId.split(':')[0]; // 'status', 'time', or 'category'

        // Time filters clear everything (status and category)
        // Status and Category are mutually exclusive with each other
        if (filterType === 'time') {
            // When activating time filter, clear status and category filters
            Array.from(activeFilters.value).forEach((id) => {
                if (id.startsWith('status:') || id.startsWith('category:')) {
                    activeFilters.value.delete(id);
                }
            });
        } else if (filterType === 'status' || filterType === 'category') {
            // When activating status or category, clear the OTHER types
            Array.from(activeFilters.value).forEach((id) => {
                if (!id.startsWith(`${filterType}:`)) {
                    activeFilters.value.delete(id);
                }
            });
        }

        // Single select within the same group - clear other filters of same type
        Array.from(activeFilters.value).forEach((id) => {
            if (id.startsWith(`${filterType}:`) && id !== filterId) {
                activeFilters.value.delete(id);
            }
        });

        // Toggle the filter
        if (activeFilters.value.has(filterId)) {
            activeFilters.value.delete(filterId);
        } else {
            activeFilters.value.add(filterId);
        }
    };

    const clearFilter = (filterId: string) => {
        activeFilters.value.delete(filterId);
    };

    const clearAllFilters = () => {
        activeFilters.value.clear();
    };

    const hasActiveFilters = computed(() => activeFilters.value.size > 0);

    const activeFiltersList = computed(() => {
        return Array.from(activeFilters.value).map((filterId) => {
            for (const group of filterGroups.value) {
                const option = group.options.find(o => o.id === filterId);
                if (option) {
                    return option;
                }
            }
            return null;
        }).filter(Boolean) as FilterOption[];
    });

    return {
    // State
        activeFilters: readonly(activeFilters),
        isFilterExpanded,
        filterGroups,
        primaryFilters,
        secondaryFilters,

        // Computed
        filteredRequests,
        hasActiveFilters,
        activeFiltersList,

        // Actions
        toggleFilter,
        clearFilter,
        clearAllFilters
    };
}
