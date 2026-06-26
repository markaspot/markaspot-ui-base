import { describe, expect, it } from 'vitest';

import {
    mergeAttributeDefinitions,
    omitOverriddenAttributeDefinitions
} from '../../../../app/utils/dashboard/serviceAttributeDefinitions';
import type { ServiceDefinitionAttribute } from '../../../../types/category';

const definition = (
    overrides: Partial<ServiceDefinitionAttribute> & Pick<ServiceDefinitionAttribute, 'code' | 'datatype' | 'description' | 'order'>
): ServiceDefinitionAttribute => ({
    variable: true,
    required: false,
    ...overrides
});

describe('serviceAttributeDefinitions', () => {
    it('merges category and internal status definitions by code with internal status taking precedence', () => {
        const merged = mergeAttributeDefinitions([
            [
                definition({ code: 'shared', datatype: 'string', description: 'Category label', order: 20 }),
                definition({ code: 'category_only', datatype: 'string', description: 'Category only', order: 10 })
            ],
            [
                definition({ code: 'shared', datatype: 'imagelist', description: 'Internal label', order: 5 }),
                definition({ code: 'internal_only', datatype: 'singlevaluelist', description: 'Internal only', order: 30 })
            ]
        ]);

        expect(merged.map(definition => definition.code)).toEqual([
            'shared',
            'category_only',
            'internal_only'
        ]);
        expect(merged[0]).toMatchObject({
            code: 'shared',
            datatype: 'imagelist',
            description: 'Internal label'
        });
    });

    it('hides category-rendered definitions that are owned by internal status', () => {
        const categoryDefinitions = [
            definition({ code: 'radbuegel_systemskizze', datatype: 'string', description: 'Category copy', order: 1 }),
            definition({ code: 'public_hint', datatype: 'string', description: 'Public hint', order: 2 })
        ];
        const internalDefinitions = [
            definition({ code: 'radbuegel_systemskizze', datatype: 'imagelist', description: 'Welche Systemskizze wird montiert?', order: 1 })
        ];

        expect(
            omitOverriddenAttributeDefinitions(categoryDefinitions, internalDefinitions)
                .map(definition => definition.code)
        ).toEqual(['public_hint']);
    });
});
