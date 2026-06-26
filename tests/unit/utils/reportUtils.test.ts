import { describe, it, expect } from 'vitest';
import { getReportStatusInfo } from '@/utils/reportUtils';
import type { Request } from '~~/types';

/**
 * Report Status Extraction Tests
 *
 * Tests the logic that extracts status information from reports.
 * This is used across the app for:
 * - Filtering reports by status
 * - Displaying status badges
 * - Map marker colors
 */

describe('getReportStatusInfo', () => {
    /**
   * Test 1: Extract status from latest status note
   */
    it('should extract status from latest status note', () => {
        const report: Partial<Request> = {
            status: 'old_status',
            extended_attributes: {
                markaspot: {
                    status_notes: [
                        {
                            status: 'open',
                            status_descriptive_name: 'Open',
                            status_hex: '#ff0000',
                            status_icon: 'open-icon',
                            comment: 'First note',
                            created: '2024-01-01'
                        },
                        {
                            status: 'in_progress',
                            status_descriptive_name: 'In Progress',
                            status_hex: '#00ff00',
                            status_icon: 'progress-icon',
                            comment: 'Latest note',
                            created: '2024-01-02'
                        }
                    ]
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        // Should use LATEST status note (last in array)
        expect(result.currentStatus).toBe('in_progress');
        expect(result.statusDescriptive).toBe('In Progress');
        expect(result.statusHex).toBe('#00ff00');
        expect(result.statusIcon).toBe('progress-icon');
        expect(result.filterKey).toBe('In Progress'); // Uses descriptive name
    });

    /**
   * Test 2: Fallback to request.status when no status notes
   */
    it('should fallback to request.status when no status notes', () => {
        const report: Partial<Request> = {
            status: 'closed',
            extended_attributes: {
                markaspot: {}
            }
        };

        const result = getReportStatusInfo(report as Request);

        expect(result.currentStatus).toBe('closed');
        expect(result.statusDescriptive).toBe('closed');
        expect(result.filterKey).toBe('closed');
        expect(result.latestStatusNote).toBeNull();
    });

    /**
   * Test 3: Handle empty status notes array
   */
    it('should handle empty status notes array', () => {
        const report: Partial<Request> = {
            status: 'open',
            extended_attributes: {
                markaspot: {
                    status_notes: []
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        expect(result.currentStatus).toBe('open');
        expect(result.latestStatusNote).toBeNull();
    });

    /**
   * Test 4: Descriptive name differs from status
   */
    it('should use descriptive name as filter key when different', () => {
        const report: Partial<Request> = {
            status: 'status_code_123',
            extended_attributes: {
                markaspot: {
                    status_notes: [
                        {
                            status: 'status_code_123',
                            status_descriptive_name: 'User Friendly Name',
                            comment: 'Note',
                            created: '2024-01-01'
                        }
                    ]
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        expect(result.currentStatus).toBe('status_code_123');
        expect(result.statusDescriptive).toBe('User Friendly Name');
        expect(result.filterKey).toBe('User Friendly Name');
    });

    /**
   * Test 5: Descriptive name same as status
   */
    it('should use status as filter key when descriptive name matches', () => {
        const report: Partial<Request> = {
            status: 'open',
            extended_attributes: {
                markaspot: {
                    status_notes: [
                        {
                            status: 'open',
                            status_descriptive_name: 'open', // Same as status
                            comment: 'Note',
                            created: '2024-01-01'
                        }
                    ]
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        expect(result.filterKey).toBe('open');
    });

    /**
   * Test 6: Fallback chain for descriptive name
   */
    it('should try fallback locations for descriptive name', () => {
        const report: Partial<Request> = {
            status: 'unknown',
            extended_attributes: {
                markaspot: {
                    status_descriptive_name: 'Fallback Name',
                    status_notes: [
                        {
                            status: 'unknown',
                            // No status_descriptive_name in note
                            comment: 'Note',
                            created: '2024-01-01'
                        }
                    ]
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        // Should fall back to markaspot.status_descriptive_name
        expect(result.statusDescriptive).toBe('Fallback Name');
    });

    /**
   * Test 7: Fallback chain for status hex
   */
    it('should try fallback locations for status hex', () => {
        const report: Partial<Request> = {
            status: 'test',
            extended_attributes: {
                markaspot: {
                    status_hex: '#999999',
                    status_notes: [
                        {
                            status: 'test',
                            // No status_hex in note
                            comment: 'Note',
                            created: '2024-01-01'
                        }
                    ]
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        // Should fall back to markaspot.status_hex
        expect(result.statusHex).toBe('#999999');
    });

    /**
   * Test 8: Handle missing extended_attributes
   */
    it('should handle missing extended_attributes', () => {
        const report: Partial<Request> = {
            status: 'open'
            // No extended_attributes
        };

        const result = getReportStatusInfo(report as Request);

        expect(result.currentStatus).toBe('open');
        expect(result.statusDescriptive).toBe('open');
        expect(result.statusHex).toBeUndefined();
        expect(result.statusIcon).toBeUndefined();
        expect(result.latestStatusNote).toBeNull();
    });

    /**
   * Test 9: Handle status note priority (latest wins)
   */
    it('should prioritize latest status note over earlier ones', () => {
        const report: Partial<Request> = {
            status: 'initial',
            extended_attributes: {
                markaspot: {
                    status_notes: [
                        {
                            status: 'first',
                            status_hex: '#111111',
                            comment: 'First',
                            created: '2024-01-01'
                        },
                        {
                            status: 'second',
                            status_hex: '#222222',
                            comment: 'Second',
                            created: '2024-01-02'
                        },
                        {
                            status: 'third',
                            status_hex: '#333333',
                            comment: 'Third',
                            created: '2024-01-03'
                        }
                    ]
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        // Should use LAST (most recent) status note
        expect(result.currentStatus).toBe('third');
        expect(result.statusHex).toBe('#333333');
        expect(result.latestStatusNote?.comment).toBe('Third');
    });

    /**
   * Test 10: Default to 'unknown' when no status
   */
    it('should default to unknown when status is missing', () => {
        const report: Partial<Request> = {
            // No status field
            extended_attributes: {
                markaspot: {}
            }
        };

        const result = getReportStatusInfo(report as Request);

        expect(result.currentStatus).toBe('unknown');
    });

    /**
   * Test 11: Real-world example - complete status flow
   */
    it('real-world: track status through lifecycle', () => {
        const report: Partial<Request> = {
            status: 'open', // Initial status
            extended_attributes: {
                markaspot: {
                    status_notes: [
                        {
                            status: 'open',
                            status_descriptive_name: 'Reported',
                            status_hex: '#e74c3c',
                            status_icon: 'alert-circle',
                            comment: 'Report submitted',
                            created: '2024-01-01T10:00:00Z'
                        },
                        {
                            status: 'acknowledged',
                            status_descriptive_name: 'Under Review',
                            status_hex: '#f39c12',
                            status_icon: 'eye',
                            comment: 'Staff reviewing',
                            created: '2024-01-02T14:30:00Z'
                        },
                        {
                            status: 'in_progress',
                            status_descriptive_name: 'Being Fixed',
                            status_hex: '#3498db',
                            status_icon: 'tool',
                            comment: 'Repair crew dispatched',
                            created: '2024-01-03T09:15:00Z'
                        }
                    ]
                }
            }
        };

        const result = getReportStatusInfo(report as Request);

        // Should reflect current state (latest status note)
        expect(result.currentStatus).toBe('in_progress');
        expect(result.statusDescriptive).toBe('Being Fixed');
        expect(result.statusHex).toBe('#3498db');
        expect(result.statusIcon).toBe('tool');
        expect(result.filterKey).toBe('Being Fixed');
        expect(result.latestStatusNote?.comment).toBe('Repair crew dispatched');
    });
});
