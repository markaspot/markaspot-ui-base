import { describe, expect, it } from 'vitest';
import { unflattenI18nOverrideObject } from '~/utils/i18nOverrides';

describe('unflattenI18nOverrideObject', () => {
    it('converts flat dot-notation override keys into nested messages', () => {
        expect(unflattenI18nOverrideObject({
            'header.app_name': 'Radverkehrsmelder',
            'meta.description': 'Meldeplattform Radbuegel der Bundesstadt Bonn'
        })).toEqual({
            header: {
                app_name: 'Radverkehrsmelder'
            },
            meta: {
                description: 'Meldeplattform Radbuegel der Bundesstadt Bonn'
            }
        });
    });

    it('rejects prototype-pollution path segments', () => {
        const result = unflattenI18nOverrideObject({
            '__proto__.polluted': 'yes',
            'constructor.prototype.polluted': 'yes',
            'header.prototype.polluted': 'yes',
            'header.app_name': 'Radverkehrsmelder'
        });

        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(result).toEqual({
            header: {
                app_name: 'Radverkehrsmelder'
            }
        });
    });
});
