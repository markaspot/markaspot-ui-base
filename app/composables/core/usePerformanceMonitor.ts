/**
 * Performance monitoring composable
 */

interface PerformanceMetric {
    name: string
    value: number
    timestamp: number
    type: 'timing' | 'counter' | 'gauge'
}

interface PageLoadMetrics {
    firstContentfulPaint: number
    largestContentfulPaint: number
    timeToInteractive: number
    cumulativeLayoutShift: number
    firstInputDelay: number
}

// Global state for performance metrics
const metrics = ref<PerformanceMetric[]>([]);
const pageLoadMetrics = ref<Partial<PageLoadMetrics>>({});

export function usePerformanceMonitor() {
    /**
   * Record a performance metric
   */
    const recordMetric = (name: string, value: number, type: 'timing' | 'counter' | 'gauge' = 'timing') => {
        metrics.value.push({
            name,
            value,
            timestamp: Date.now(),
            type
        });

        // Keep only last 100 metrics to prevent memory leaks
        if (metrics.value.length > 100) {
            metrics.value = metrics.value.slice(-100);
        }
    };

    /**
   * Start a timing measurement
   */
    const startTiming = (name: string): () => void => {
        const startTime = performance.now();

        return () => {
            const duration = performance.now() - startTime;
            recordMetric(name, duration, 'timing');
        };
    };

    /**
   * Measure async operation performance
   */
    const measureAsync = async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
        const endTiming = startTiming(name);
        try {
            const result = await operation();
            endTiming();
            return result;
        } catch (error) {
            endTiming();
            recordMetric(`${name}_error`, 1, 'counter');
            throw error;
        }
    };

    /**
   * Collect Web Vitals metrics
   */
    const collectWebVitals = () => {
        if (typeof window === 'undefined') return;

        // First Contentful Paint
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    pageLoadMetrics.value.firstContentfulPaint = entry.startTime;
                    recordMetric('first_contentful_paint', entry.startTime);
                }
            }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            pageLoadMetrics.value.largestContentfulPaint = lastEntry.startTime;
            recordMetric('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            pageLoadMetrics.value.cumulativeLayoutShift = clsValue;
            recordMetric('cumulative_layout_shift', clsValue, 'gauge');
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const fid = entry.processingStart - entry.startTime;
                pageLoadMetrics.value.firstInputDelay = fid;
                recordMetric('first_input_delay', fid);
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
    };

    /**
   * Get performance summary
   */
    const getPerformanceSummary = computed(() => {
        const timingMetrics = metrics.value.filter(m => m.type === 'timing');
        const counters = metrics.value.filter(m => m.type === 'counter');

        return {
            webVitals: pageLoadMetrics.value,
            avgTimings: timingMetrics.reduce((acc, metric) => {
                acc[metric.name] = acc[metric.name] || [];
                acc[metric.name].push(metric.value);
                return acc;
            }, {} as Record<string, number[]>),
            errorCounts: counters.reduce((acc, metric) => {
                acc[metric.name] = (acc[metric.name] || 0) + metric.value;
                return acc;
            }, {} as Record<string, number>),
            totalMetrics: metrics.value.length
        };
    });

    /**
   * Monitor component render performance
   */
    const monitorComponent = (componentName: string) => {
        return {
            onBeforeMount: () => {
                recordMetric(`${componentName}_mount_start`, performance.now());
            },
            onMounted: () => {
                recordMetric(`${componentName}_mount_complete`, performance.now());
            },
            onBeforeUpdate: () => {
                recordMetric(`${componentName}_update_start`, performance.now());
            },
            onUpdated: () => {
                recordMetric(`${componentName}_update_complete`, performance.now());
            }
        };
    };

    /**
   * Monitor API performance
   */
    const monitorApiCall = async <T>(
        endpoint: string,
        operation: () => Promise<T>
    ): Promise<T> => {
        return measureAsync(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, operation);
    };

    /**
   * Get performance report for debugging
   */
    const getPerformanceReport = () => {
        const summary = getPerformanceSummary.value;

        console.group('🚀 Performance Report');
        console.log('📊 Web Vitals:', summary.webVitals);

        // Show average timings for map operations
        Object.entries(summary.avgTimings).forEach(([metric, values]) => {
            if (metric.includes('map_zoom') || metric.includes('map_marker') || metric.includes('map_visibility')) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                console.log(`⚡ ${metric}: ${avg.toFixed(2)}ms (${values.length} samples)`);
            }
        });

        if (Object.keys(summary.errorCounts).length > 0) {
            console.log('❌ Errors:', summary.errorCounts);
        }
        console.groupEnd();

        return summary;
    };

    /**
   * Get zoom performance specifically
   */
    const getZoomPerformance = () => {
        const zoomMetrics = metrics.value.filter(m => m.name.includes('map_zoom'));
        if (zoomMetrics.length === 0) return null;

        const durations = zoomMetrics
            .filter(m => m.name === 'map_zoom_duration')
            .map(m => m.value);

        if (durations.length === 0) return null;

        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        return {
            averageMs: avg,
            minMs: min,
            maxMs: max,
            samples: durations.length,
            status: avg < 100 ? 'excellent' : avg < 200 ? 'good' : avg < 500 ? 'fair' : 'poor'
        };
    };

    /**
   * Clear all metrics
   */
    const clearMetrics = () => {
        metrics.value = [];
        pageLoadMetrics.value = {};
    };

    return {
    // State
        metrics: computed(() => metrics.value),
        pageLoadMetrics: computed(() => pageLoadMetrics.value),
        performanceSummary: getPerformanceSummary,

        // Methods
        recordMetric,
        startTiming,
        measureAsync,
        collectWebVitals,
        monitorComponent,
        monitorApiCall,
        getPerformanceReport,
        getZoomPerformance,
        clearMetrics
    };
}
