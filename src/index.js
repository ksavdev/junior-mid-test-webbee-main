/**
 * @typedef {Object} Filter
 * @property {string} [operator] - Filter operation identifier (e.g., 'smart')
 * @property {*} value - Filter value (may contain special array format ['cross-table', ...])
 * @property {Array} [filtersSet] - Nested filters collection
 */

/**
 * @typedef {Object} FilterSet
 * @property {Array<Filter|FilterSet>} filtersSet - Main collection of filters and nested sets
 */

/**
 * @typedef {Object} TraverseFilterFlags
 * @property {boolean} [crossFilters=false] - Whether to process cross-table filters
 * @property {boolean} [subFilters=true] - Whether to process nested sub-filters
 */

/**
 * @typedef {(filter: Filter) => (string|undefined)} SplitKeyFunction
 */

/**
 * Splits a nested filter structure into categorized subsets
 * @param {FilterSet} filters - Main filter structure containing nested filters. Structure:
 *                              {
 *                                filtersSet: [
 *                                  { operator, value }, // Basic filter
 *                                  {
 *                                    filtersSet: [...]  // Nested sub-filter set
 *                                  },
 *                                  {
 *                                    value: ['cross-table', { filtersSet: [...] }] // Cross-table filters
 *                                  }
 *                                ]
 *                              }
 * @param {SplitKeyFunction} splitFoo - Key generation function that examines individual filters
 * @param {TraverseFilterFlags} [traverseFlags] - Traversal control flags
 * @returns {Object<string, FilterSet>} Map of filter subsets keyed by splitFoo results. Each entry maintains
 *                                      the original structure but only contains filters matching its key.
 *
 * @example
 * // Returns { smart: { filtersSet: [...] }, default: { filtersSet: [...] } }
 * splitFilters(filters, filter => filter.operator === 'smart' ? 'smart' : 'default');
 */

function splitFilters(filters, splitFoo, traverseFlags = { crossFilters: false, subFilters: true }) {
    if (!filters || !Array.isArray(filters.filtersSet)) return {};

    const result = {};

    function getOrCreate(key, conj) {
        if (!result[key]) {
            result[key] = { conjunction: conj || filters.conjunction || 'and', filtersSet: [] };
        }
        return result[key];
    }


    function processSimple(filter, parentConjunction) {
        if (
            filter.operator === 'hasAnyOf' &&
            Array.isArray(filter.value) &&
            filter.value[0] === 'cross-table' &&
            filter.value[1] &&
            Array.isArray(filter.value[1].filtersSet)
        ) {
            const inner = filter.value[1];
            const innerSplit = splitFilters(inner, splitFoo, traverseFlags);
            if (innerSplit.default) {
                const newFilter = { ...filter, value: ['cross-table', innerSplit.default] };
                getOrCreate('default', filter.conjunction || parentConjunction).filtersSet.push(newFilter);
            }
            if (innerSplit.smart) {
                const newFilter = { ...filter, value: ['cross-table', innerSplit.smart] };
                getOrCreate('smart', filter.conjunction || parentConjunction).filtersSet.push(newFilter);
            }
        } else {
            const key = splitFoo(filter);
            if (key) {
                getOrCreate(key, filter.conjunction || parentConjunction).filtersSet.push(filter);
            }
        }
    }


    for (const item of filters.filtersSet) {
        if (item && Array.isArray(item.filtersSet) && traverseFlags.subFilters) {

            const nested = splitFilters(item, splitFoo, traverseFlags);

            const keys = Object.keys(nested);
            if (keys.length === 1) {
                const key = keys[0];
                const newGroup = { ...item, filtersSet: nested[key].filtersSet };
                getOrCreate(key, filters.conjunction).filtersSet.push(newGroup);
            } else if (keys.length === 2) {

                for (const key of keys) {
                    const newGroup = { ...item, filtersSet: nested[key].filtersSet };
                    getOrCreate(key, filters.conjunction).filtersSet.push(newGroup);
                }
            }
        } else {
            processSimple(item, filters.conjunction);
        }
    }


    for (const k of Object.keys(result)) {
        if (!result[k].filtersSet.length) delete result[k];
    }

    return result;
}



/**
 * Implementation of {@link SplitKeyFunction} that categorizes filters into:
 * - 'smart' (operator: 'smart' and not cross-table)
 * - 'default' (any other operator)
 * - undefined (non-operator filters or cross-table markers)
 *
 * @param {Filter} filter - Filter to evaluate (matches common filter structure)
 * @returns {ReturnType<SplitKeyFunction>} Categorization result following the pattern:
 *          - 'smart'|'default' for valid operator filters
 *          - undefined for invalid/excluded cases
 *
 * @example <caption>Basic categorization</caption>
 * smartDefaultIndexer({ operator: 'smart', value: 42 }); // 'smart'
 * smartDefaultIndexer({ operator: 'eq', value: 'X' });   // 'default'
 *
 * @example <caption>Exclusion cases</caption>
 * // Cross-table filter exclusion
 * smartDefaultIndexer({ operator: 'smart', value: ['cross-table', ...] }); // undefined
 * // Missing operator exclusion
 * smartDefaultIndexer({ value: 'no-operator' }); // undefined
 */
function smartDefaultIndexer(filter) {
    if (!filter.operator) return undefined;
    if (filter.operator === 'smart') {
        if (Array.isArray(filter.value) && filter.value[0] === 'cross-table') return undefined;
        return 'smart';
    }
    if (filter.operator === 'hasAnyOf' && Array.isArray(filter.value) && filter.value.length > 1) {
        const nested = filter.value[1];
        if (nested && nested.filtersSet && nested.filtersSet.some(f => f.operator === 'smart')) return 'smart';
    }
    return 'default';
}






module.exports = {
    splitFilters,
    smartDefaultIndexer
}
