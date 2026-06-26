import type { Request } from '~~/types';

export interface MagnitudeConfig {
    enabled: boolean
    factors: {
        hazardLevel: boolean
        age: boolean
        status: boolean
    }
    minScale: number
    maxScale: number
}

/**
 * Compute a magnitude value (0.0 - 1.0) for a report based on enabled factors.
 * Used to scale map pin sizes via MapLibre icon-size expression.
 *
 * Factor calculations:
 * - hazardLevel: normalized 0-4 integer from extended_attributes (default 0.5)
 * - age: newer reports score higher (linear decay over 365 days)
 * - status: open=1.0, in_process=0.6, closed/other=0.3
 */
export function computeMagnitude(report: Request, config: MagnitudeConfig): number {
    if (!config.enabled) return 1;

    const enabledFactors: number[] = [];

    if (config.factors.hazardLevel) {
        const raw = report.extended_attributes?.drupal?.field_hazard_level?.[0]?.value;
        const hazardValue = Number(raw);
        const normalized = Number.isFinite(hazardValue) ? hazardValue / 4 : 0.5;
        enabledFactors.push(Math.min(Math.max(normalized, 0), 1));
    }

    if (config.factors.age) {
        const requested = report.requested_datetime;
        if (requested) {
            const daysSince = (Date.now() - new Date(requested).getTime()) / (1000 * 60 * 60 * 24);
            enabledFactors.push(Number.isFinite(daysSince) ? 1 - Math.min(daysSince / 365, 1) : 0.5);
        } else {
            enabledFactors.push(0.5);
        }
    }

    if (config.factors.status) {
        const status = (report.status || '').toLowerCase();
        if (status === 'open') {
            enabledFactors.push(1.0);
        } else if (status === 'in_process' || status === 'in process') {
            enabledFactors.push(0.6);
        } else {
            enabledFactors.push(0.3);
        }
    }

    if (enabledFactors.length === 0) return 0.5;

    return enabledFactors.reduce((sum, v) => sum + v, 0) / enabledFactors.length;
}
