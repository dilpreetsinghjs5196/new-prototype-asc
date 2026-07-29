/**
 * Score Calculator Module
 * Multi-objective evaluation engine calculating scores based on various weighted business factors.
 */

export const calculateMultiObjectiveScore = (candidate, weights) => {
    // Max baseline values for normalization
    const MAX_PROFIT = 150000; 
    const MAX_COST = 50000; 
    const MAX_FREQ = 50; 
    
    // Normalize each factor (0 to 1 scale, where 1 is optimal)
    // 1. Profit
    const normProfit = Math.max(0, Math.min(candidate.estimatedProfit / MAX_PROFIT, 1));
    
    // 2. Efficiency / OR Utilization impact (profit per minute)
    const profitPerMin = candidate.duration > 0 ? (candidate.estimatedProfit / candidate.duration) : 0;
    const normEfficiency = Math.max(0, Math.min(profitPerMin / 2000, 1)); 

    // 3. Historical Frequency
    const normFrequency = Math.max(0, Math.min((candidate.historicalFrequency || 0) / MAX_FREQ, 1)); 
    
    // 4. Surgeon Preference (assuming a 1-10 scale in data)
    const normPreference = Math.max(0, Math.min((candidate.surgeonPreference || 5) / 10, 1)); 
    
    // 5. Duration Accuracy (assuming a 0-100% scale)
    const normAccuracy = Math.max(0, Math.min((candidate.durationAccuracy || 80) / 100, 1)); 
    
    // 6. Cancellation Risk (lower is better, so we invert) (assuming 0-100%)
    const normCancellationRisk = 1 - Math.max(0, Math.min((candidate.cancellationRisk || 10) / 100, 1)); 
    
    // 7. Supplies Cost (lower is better)
    const normSuppliesCost = 1 - Math.max(0, Math.min((candidate.estimatedSuppliesCost || 0) / MAX_COST, 1));
    
    // 8. Implant Cost (lower is better)
    const normImplantCost = 1 - Math.max(0, Math.min((candidate.implantCost || 0) / MAX_COST, 1));
    
    // 9. Confidence Score (0-100%)
    const normConfidence = Math.max(0, Math.min((candidate.confidenceScore || 90) / 100, 1));
    
    // 10. Volume / Duration Inversely Proportional (to maximize patients)
    // 30 mins -> very high score, 240 mins -> very low score
    const normVolume = Math.max(0, 1 - Math.min((candidate.duration || 60) / 240, 1));

    // Calculate final weighted composite score
    const score = (
        (normProfit * (weights.profit || 0)) +
        (normEfficiency * (weights.utilization || 0)) +
        (normFrequency * (weights.frequency || 0)) +
        (normPreference * (weights.preference || 0)) +
        (normAccuracy * (weights.accuracy || 0)) +
        (normCancellationRisk * (weights.cancellationRisk || 0)) +
        (normSuppliesCost * (weights.suppliesCost || 0)) +
        (normImplantCost * (weights.implantCost || 0)) +
        (normConfidence * (weights.confidence || 0)) +
        (normVolume * (weights.volume || 0))
    );

    return score;
};
