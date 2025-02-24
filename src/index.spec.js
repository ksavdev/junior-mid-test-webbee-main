const { smartDefaultIndexer, splitFilters } = require('./index');

describe('splitFilters', () => {
    describe('Nested filters', () => {
        it('should follow a 2 way nested structure', () => {
            const split = splitFilters(
                {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            field: '_name',
                            operator: 'smart',
                            value: 'T-bone',
                        },
                        {
                            conjunction: 'and',
                            filtersSet: [
                                {
                                    field: '_aa',
                                    operator: 'smart',
                                    value: 'stir-fry',
                                },
                            ],
                        },
                    ],
                },
                smartDefaultIndexer,
                {
                    crossFilters: false,
                    subFilters: true,
                },
            );

            expect(split).toEqual({
                smart: {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            field: '_name',
                            operator: 'smart',
                            value: 'T-bone',
                        },
                        {
                            conjunction: 'and',
                            filtersSet: [
                                {
                                    field: '_aa',
                                    operator: 'smart',
                                    value: 'stir-fry',
                                },
                            ],
                        },
                    ],
                },
            });
        });

        it('should follow a simple nested filter', () => {
            const split = splitFilters(
                {
                    conjunction: 'and',
                    filtersSet: [
                        { field: 'firstName', operator: 'contains', value: 'Tobias' },
                        {
                            conjunction: 'or',
                            filtersSet: [
                                { field: 'verified', operator: 'isEqual', value: true },
                                {
                                    field: 'description',
                                    operator: 'smart',
                                    value: 'does crypto',
                                },
                            ],
                        },
                        { field: 'location', operator: 'smart', value: 'is in Germany' },
                    ],
                },
                smartDefaultIndexer,
                {
                    crossFilters: false,
                    subFilters: true,
                },
            );

            expect(split).toEqual({
                default: {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            field: 'firstName',
                            operator: 'contains',
                            value: 'Tobias',
                        },
                        {
                            conjunction: 'or',
                            filtersSet: [
                                {
                                    field: 'verified',
                                    operator: 'isEqual',
                                    value: true,
                                },
                            ],
                        },
                    ],
                },
                smart: {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            conjunction: 'or',
                            filtersSet: [
                                {
                                    field: 'description',
                                    operator: 'smart',
                                    value: 'does crypto',
                                },
                            ],
                        },
                        {
                            field: 'location',
                            operator: 'smart',
                            value: 'is in Germany',
                        },
                    ],
                },
            });
        });
    });

    describe('Basic Functionality', () => {
        it('should split simple filters into top-level groups', () => {
            const split = splitFilters(simpleFilters, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split).toEqual({
                default: {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            field: 'firstName',
                            operator: 'contains',
                            value: 'Tobias',
                        },
                    ],
                },
                smart: {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            field: 'location',
                            operator: 'smart',
                            value: 'is in Germany',
                        },
                    ],
                },
            });
        });

        it('should handle nested cross-table filters', () => {
            const split = splitFilters(nestedFilters, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split).toEqual({
                default: {
                    conjunction: 'and',
                    filtersSet: [
                        { field: 'firstName', operator: 'contains', value: 'Tobias' },
                        {
                            field: 'companyLink',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'or',
                                    filtersSet: [
                                        { field: 'verified', operator: 'isEqual', value: true },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                smart: {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            field: 'companyLink',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'or',
                                    filtersSet: [
                                        {
                                            field: 'description',
                                            operator: 'smart',
                                            value: 'does crypto',
                                        },
                                    ],
                                },
                            ],
                        },
                        { field: 'location', operator: 'smart', value: 'is in Germany' },
                    ],
                },
            });
        });

        it('should handle default-only filters', () => {
            const split = splitFilters(nestedAllDefaultFilters, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split).toEqual({
                default: {
                    conjunction: 'and',
                    filtersSet: [
                        { field: 'name', operator: 'contains', value: 'Alice' },
                        {
                            field: 'link',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'or',
                                    filtersSet: [
                                        { field: 'age', operator: 'greaterThan', value: 30 },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });
        });

        it('should lift deep nested smart filters', () => {
            const split = splitFilters(onlyDeep, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split).toEqual({
                default: {
                    conjunction: 'or',
                    filtersSet: [
                        {
                            field: 'nested',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'and',
                                    filtersSet: [
                                        { field: 'nestedDefault', operator: 'equals', value: 5 },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                smart: {
                    conjunction: 'or',
                    filtersSet: [
                        {
                            field: 'nested',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'and',
                                    filtersSet: [
                                        {
                                            field: 'nestedSmart',
                                            operator: 'smart',
                                            value: 'nested',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty filtersSet', () => {
            const emptyFilters = { conjunction: 'and', filtersSet: [] };
            const split = splitFilters(emptyFilters, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split).toEqual({});
        });

        it('should process multiple nested cross-table levels', () => {
            const multiLevelNested = {
                conjunction: 'and',
                filtersSet: [
                    {
                        field: 'level1',
                        operator: 'hasAnyOf',
                        value: [
                            'cross-table',
                            {
                                conjunction: 'or',
                                filtersSet: [
                                    {
                                        field: 'level2',
                                        operator: 'smart',
                                        value: 'nested1',
                                    },
                                    {
                                        field: 'level2Link',
                                        operator: 'hasAnyOf',
                                        value: [
                                            'cross-table',
                                            {
                                                conjunction: 'and',
                                                filtersSet: [
                                                    {
                                                        field: 'level3',
                                                        operator: 'smart',
                                                        value: 'deep',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const split = splitFilters(multiLevelNested, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split).toEqual({
                smart: {
                    conjunction: 'and',
                    filtersSet: [
                        {
                            field: 'level1',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'or',
                                    filtersSet: [
                                        {
                                            field: 'level2',
                                            operator: 'smart',
                                            value: 'nested1',
                                        },
                                        {
                                            field: 'level2Link',
                                            operator: 'hasAnyOf',
                                            value: [
                                                'cross-table',
                                                {
                                                    conjunction: 'and',
                                                    filtersSet: [
                                                        {
                                                            field: 'level3',
                                                            operator: 'smart',
                                                            value: 'deep',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });
        });

        it('should handle all smart filters', () => {
            const allSmartFilters = {
                conjunction: 'or',
                filtersSet: [
                    { field: 'a', operator: 'smart', value: '1' },
                    { field: 'b', operator: 'smart', value: '2' },
                ],
            };

            const split = splitFilters(allSmartFilters, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split).toEqual({
                smart: {
                    conjunction: 'or',
                    filtersSet: [
                        { field: 'a', operator: 'smart', value: '1' },
                        { field: 'b', operator: 'smart', value: '2' },
                    ],
                },
            });
        });

        it('should handle mixed conjunctions in nested groups', () => {
            const mixedConjunctions = {
                conjunction: 'or',
                filtersSet: [
                    {
                        field: 'root',
                        operator: 'hasAnyOf',
                        value: [
                            'cross-table',
                            {
                                conjunction: 'and',
                                filtersSet: [
                                    {
                                        field: 'nestedSmart',
                                        operator: 'smart',
                                        value: 'test',
                                    },
                                    {
                                        field: 'nestedDefault',
                                        operator: 'equals',
                                        value: 10,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const split = splitFilters(mixedConjunctions, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split.smart.conjunction).toBe('or');
            expect(split.default.conjunction).toBe('or');
            expect(split.smart.filtersSet[0].value[1].conjunction).toBe('and');
        });

        it('should ignore non-array cross-table values', () => {
            const invalidCrossTable = {
                conjunction: 'and',
                filtersSet: [
                    {
                        field: 'invalid',
                        operator: 'hasAnyOf',
                        value: 'cross-table', // Not an array
                    },
                ],
            };

            const split = splitFilters(invalidCrossTable, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: false,
            });

            expect(split.default.filtersSet[0].value).toBe('cross-table');
        });
    });

    describe('Mixxed nested+cross-table', () => {
        it('should split mixed cross-table, nested, and top-level filters', () => {
            const inputFilters = {
                conjunction: 'or',
                filtersSet: [
                    { field: 'topSmart', operator: 'smart', value: 'top' },
                    {
                        field: 'crossTableField',
                        operator: 'hasAnyOf',
                        value: [
                            'cross-table',
                            {
                                conjunction: 'and',
                                filtersSet: [
                                    { field: 'crossSmart', operator: 'smart', value: 'cross' },
                                    { field: 'crossDefault', operator: 'equals', value: 20 },
                                ],
                            },
                        ],
                    },
                    {
                        conjunction: 'not',
                        filtersSet: [
                            { field: 'nestedSmart', operator: 'smart', value: 'nested' },
                            { field: 'nestedDefault', operator: 'contains', value: 'text' },
                        ],
                    },
                ],
            };

            const split = splitFilters(inputFilters, smartDefaultIndexer, {
                crossFilters: true,
                subFilters: true,
            });

            expect(split).toEqual({
                default: {
                    conjunction: 'or',
                    filtersSet: [
                        {
                            field: 'crossTableField',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'and',
                                    filtersSet: [
                                        { field: 'crossDefault', operator: 'equals', value: 20 },
                                    ],
                                },
                            ],
                        },
                        {
                            conjunction: 'not',
                            filtersSet: [
                                { field: 'nestedDefault', operator: 'contains', value: 'text' },
                            ],
                        },
                    ],
                },
                smart: {
                    conjunction: 'or',
                    filtersSet: [
                        { field: 'topSmart', operator: 'smart', value: 'top' },
                        {
                            field: 'crossTableField',
                            operator: 'hasAnyOf',
                            value: [
                                'cross-table',
                                {
                                    conjunction: 'and',
                                    filtersSet: [
                                        { field: 'crossSmart', operator: 'smart', value: 'cross' },
                                    ],
                                },
                            ],
                        },
                        {
                            conjunction: 'not',
                            filtersSet: [
                                { field: 'nestedSmart', operator: 'smart', value: 'nested' },
                            ],
                        },
                    ],
                },
            });
        });
    });
});

const simpleFilters = {
    conjunction: 'and',
    filtersSet: [
        { field: 'firstName', operator: 'contains', value: 'Tobias' },
        { field: 'location', operator: 'smart', value: 'is in Germany' },
    ],
};

const nestedFilters = {
    conjunction: 'and',
    filtersSet: [
        { field: 'firstName', operator: 'contains', value: 'Tobias' },
        {
            field: 'companyLink',
            operator: 'hasAnyOf',
            value: [
                'cross-table',
                {
                    conjunction: 'or',
                    filtersSet: [
                        { field: 'verified', operator: 'isEqual', value: true },
                        {
                            field: 'description',
                            operator: 'smart',
                            value: 'does crypto',
                        },
                    ],
                },
            ],
        },
        { field: 'location', operator: 'smart', value: 'is in Germany' },
    ],
};

const nestedAllDefaultFilters = {
    conjunction: 'and',
    filtersSet: [
        { field: 'name', operator: 'contains', value: 'Alice' },
        {
            field: 'link',
            operator: 'hasAnyOf',
            value: [
                'cross-table',
                {
                    conjunction: 'or',
                    filtersSet: [{ field: 'age', operator: 'greaterThan', value: 30 }],
                },
            ],
        },
    ],
};

const onlyDeep = {
    conjunction: 'or',
    filtersSet: [
        {
            field: 'nested',
            operator: 'hasAnyOf',
            value: [
                'cross-table',
                {
                    conjunction: 'and',
                    filtersSet: [
                        { field: 'nestedSmart', operator: 'smart', value: 'nested' },
                        { field: 'nestedDefault', operator: 'equals', value: 5 },
                    ],
                },
            ],
        },
    ],
};
