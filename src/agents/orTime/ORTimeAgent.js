import { predictDuration } from '../../services/aiOperations/PredictionEngine';

/**
 * OR Time Agent
 * Following specification in Section 15 of agent/project.md
 */
export const executeORTimeTask = async (taskContext, systemContext) => {
    const cptCode = taskContext.cptCode || {};
    const historicalAvg = systemContext.historicalAvg || {};
    
    const predictedMin = predictDuration(cptCode, historicalAvg);

    return {
        agent: "orTime",
        status: "completed",
        requestId: taskContext.requestId,
        result: {
            predictedDurationMinutes: predictedMin,
            setupTimeMinutes: 15,
            turnoverTimeMinutes: 20
        },
        confidence: 0.92,
        warnings: [],
        requiresHumanReview: false,
        nextRecommendedAgents: ["scheduling"]
    };
};
