import type { ServiceDefinitionAttribute } from '../../../types/category';

export const mergeAttributeDefinitions = (
    definitionGroups: ServiceDefinitionAttribute[][]
): ServiceDefinitionAttribute[] => {
    const byCode = new Map<string, ServiceDefinitionAttribute>();
    for (const definitions of definitionGroups) {
        for (const definition of definitions) {
            if (!definition.code) continue;
            byCode.set(definition.code, definition);
        }
    }
    return [...byCode.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const omitOverriddenAttributeDefinitions = (
    definitions: ServiceDefinitionAttribute[],
    overridingDefinitions: ServiceDefinitionAttribute[]
): ServiceDefinitionAttribute[] => {
    const overridingCodes = new Set(
        overridingDefinitions
            .map(definition => definition.code)
            .filter((code): code is string => Boolean(code))
    );

    return definitions.filter(definition => !definition.code || !overridingCodes.has(definition.code));
};
