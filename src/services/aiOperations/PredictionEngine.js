/**
 * Prediction Engine Module
 * Uses historical data and statistical models to predict future parameters 
 * (e.g., missing durations, expected delays).
 */

export const predictDuration = (cpt, historicalAvgDurations) => {
    // Priority: 1) CPT explicitly defined average_duration, 2) Historical average, 3) Default 60 min
    return cpt.average_duration || historicalAvgDurations[cpt.code] || 60;
};
