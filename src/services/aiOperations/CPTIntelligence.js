/**
 * CPT Intelligence Module
 * Analyzes and filters CPT codes based on categories and surgeon capabilities.
 */

import { hasSurgeonPerformedCpt } from './SurgeonIntelligence';

export const getUniqueCategories = (cptCodes) => {
    return ['All', ...new Set(cptCodes.map(c => c.category).filter(Boolean))];
};

export const filterCptCodes = (cptCodes, surgeries, selectedCategory, selectedSurgeon) => {
    return cptCodes.filter(cpt => {
        const matchCategory = selectedCategory === 'All' || cpt.category === selectedCategory;
        const matchSurgeon = hasSurgeonPerformedCpt(surgeries, selectedSurgeon, cpt.code);
        
        return matchCategory && matchSurgeon;
    });
};
