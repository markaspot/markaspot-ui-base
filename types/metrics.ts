// types/metrics.ts
// Metrics dashboard types used by pro-layer components

export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface MetricsFilters {
    dateRange: {
        start: string
        end: string
    }
    category: number | null
    status: number | null
    granularity: TimeGranularity
    groupFilter: boolean
    jurisdictionId?: string
}

export interface KPI {
    total_requests: number
    open_requests: number
    closed_requests: number
    avg_processing_time: number
    median_processing_time: number
    fcr_rate: number
}

export interface VolumeDataPoint {
    /** Period label (e.g., "2024-01-15", "KW 3", "Jan 2024") */
    period: string
    /** Number of new requests in this period */
    new_requests: number
    /** Number of closed requests in this period */
    closed_requests: number
}

export interface ProcessingTimeDataPoint {
    /** Period label */
    period: string
    /** Average processing time in hours */
    avg_time: number
    /** Median processing time in hours */
    median_time: number
}

export interface ForwardingDetail {
    /** Category ID */
    tid: number
    /** Category name */
    category: string
    /** Number of requests forwarded */
    forwarded_count: number
    /** Number of requests not forwarded */
    not_forwarded_count: number
    /** Percentage of requests forwarded */
    forwarding_rate: number
}

export interface HazardStatistics {
    /** Breakdown by hazard level */
    by_level: Array<{
        level: number
        label: string
        count: number
        color: string
    }>
    /** Breakdown by category */
    by_category: Array<{
        category: string
        label: string
        count: number
    }>
    /** Number of critical (level 4) requests */
    critical_count: number
    /** Number of high priority (level 3-4) requests */
    high_priority_count: number
    /** Total number of hazard reports */
    total_hazards: number
}
