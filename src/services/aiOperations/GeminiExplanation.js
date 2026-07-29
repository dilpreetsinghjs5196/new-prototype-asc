/**
 * Gemini Explanation Module
 * Integrates with the LLM to generate narrative explanations of the optimized schedule.
 */

import { sendMessageToGemini } from '../../lib/gemini';

export const generateScheduleExplanation = async (recommendation) => {
    try {
        const contextData = JSON.stringify({
            Strategy: recommendation.strategyName || 'Unknown',
            Financial_KPIs: {
                ProjectedRevenue: recommendation.totalRevenue,
                ProjectedNetProfit: recommendation.totalProfit,
                ProfitMargin: `${recommendation.profitMargin}%`
            },
            Optimization_Results: {
                TotalCases: recommendation.totalCases,
                OR_Utilization: `${recommendation.utilization}%`,
                IdleTime_Mins: recommendation.idleTime,
                Overtime_Mins: recommendation.overtime,
                AverageTurnover_Mins: recommendation.avgTurnover,
                ConfidenceScore: `${recommendation.avgConfidence}%`,
                RiskScore: `${recommendation.avgRisk}%`
            }
        }, null, 2);

        const prompt = `
Analyze the provided Optimization Results and Financial KPIs for the selected scheduling strategy.
Do NOT calculate or suggest schedules. Your role is only to explain the provided optimization results.

Generate an executive summary explaining:
- Why this schedule was selected (based on the strategy)
- Financial impact
- Operational impact
- Risks
- Recommendations

Keep the entire explanation under 300 words. Format using markdown with clear headings or bullet points.
`;

        const response = await sendMessageToGemini(prompt, [], contextData);
        return response;
    } catch (error) {
        console.error("Error generating Gemini explanation:", error);
        return "An error occurred while generating the AI explanation.";
    }
};
