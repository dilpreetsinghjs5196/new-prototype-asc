import { buildCPTProfiles } from '../services/aiOperations/HistoricalIntelligence';
import { hasSurgeonPerformedCpt } from '../services/aiOperations/SurgeonIntelligence';

/**
 * CPT Codes Agent
 * Following the master workflow in cpt-codes-agent-workflow.md
 * 
 * Responsibilities:
 * - Search CPT registry
 * - Match procedure descriptions
 * - Consider historical surgeon information
 * - Rank candidates
 * - Identify ambiguity
 * - Return structured Agent Result Contract
 */

export const executeCPTTask = async (taskContext, systemContext) => {
    // Input format defined in Section 4
    const procedure = taskContext.procedure || {};
    const surgeon = taskContext.surgeon || {};
    
    const procedureDescription = procedure.description;
    const surgeonName = surgeon.id; // Usually we'll pass the name or id here

    const { cptCodes, surgeries } = systemContext;
    const warnings = [];
    let requiresHumanReview = false;

    // 1. Validate Required Information (Section 7, Step 3)
    if (!procedureDescription) {
        return {
            agent: "cpt",
            status: "failed",
            requestId: taskContext.requestId || `REQ-${Date.now()}`,
            result: null,
            confidence: 0,
            warnings: ["Missing procedure.description"],
            requiresHumanReview: true,
            nextRecommendedAgents: []
        };
    }

    if (!surgeonName) {
        warnings.push("No surgeon provided; falling back to generalized CPT matching.");
    }

    // 2. Build Historical Profiles to gather base metrics
    const cptProfiles = buildCPTProfiles(cptCodes, surgeries);

    // 3. Match and Rank Candidates (Section 7, Steps 5-7)
    // Procedure Match (40%), Body Part (20%), Context (15%), History (10%), Surgeon History (10%), Data Conf (5%)
    const candidates = cptCodes.map(cpt => {
        let score = 0;
        let historicalMatch = false;
        let surgeonHistoryMatch = false;

        const procLower = procedureDescription.toLowerCase();
        const descLower = cpt.description.toLowerCase();
        
        // Procedure Match (Max 40)
        if (descLower === procLower) {
            score += 40;
        } else if (descLower.includes(procLower) || procLower.includes(descLower)) {
            score += 25;
        }

        const keywords = procLower.split(/[\s,]+/);
        let matches = 0;
        keywords.forEach(word => {
            if (word.length > 3) {
                // Strip common clinical/English suffixes to match word stems
                let stem = word.replace(/(ment|plasty|scopy|ectomy|otomy|ostomy|ation|ing|ed|es|s)$/, '');
                if (stem.length < 4) stem = word; 
                
                if (descLower.includes(word) || (stem !== word && descLower.includes(stem))) {
                    matches++;
                }
            }
        });
        if (matches > 0) score += Math.min(15, matches * 5); // Remainder of Procedure Match

        // Body Part Match (Max 20)
        if (procedure.bodyPart && descLower.includes(procedure.bodyPart.toLowerCase())) {
            score += 20;
        }

        // Historical Match (Max 10)
        const profile = cptProfiles[cpt.code];
        if (profile && profile.casesPerformed > 0) {
            historicalMatch = true;
            score += 10;
        }

        // Surgeon History (Max 10)
        if (surgeonName && surgeonName !== 'All') {
            surgeonHistoryMatch = hasSurgeonPerformedCpt(surgeries, surgeonName, cpt.code);
            if (surgeonHistoryMatch) {
                score += 10;
            }
        }

        return {
            code: cpt.code,
            description: cpt.description,
            score: Math.min(100, score) / 100, // Normalize to 0-1
            grossCharge: cpt.gross_charge || 0,
            cost: cpt.cost || 0,
            evidence: {
                registryMatch: true, // We are searching the registry
                historicalMatch,
                surgeonHistoryMatch
            }
        };
    }).filter(c => c.score > 0);

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // 4. Identify ambiguity and confidence
    let confidence = 0;
    let primaryCpt = null;
    let alternatives = [];

    if (candidates.length === 0) {
        warnings.push(`No CPT codes matched the description: "${procedureDescription}"`);
        requiresHumanReview = true;
    } else {
        primaryCpt = {
            code: candidates[0].code,
            description: candidates[0].description,
            score: candidates[0].score,
            grossCharge: candidates[0].grossCharge,
            cost: candidates[0].cost
        };
        
        confidence = candidates[0].score;

        // Populate alternatives
        alternatives = candidates.slice(1, 3).map(c => ({
            code: c.code,
            description: c.description,
            score: c.score,
            grossCharge: c.grossCharge,
            cost: c.cost
        }));

        // Check for ambiguity
        if (candidates.length > 1 && (candidates[0].score - candidates[1].score < 0.1)) {
            warnings.push("Ambiguous CPT mapping. Multiple procedures closely match.");
            requiresHumanReview = true;
            confidence -= 0.15; // lower confidence if ambiguous
        }

        if (confidence < 0.75) {
            requiresHumanReview = true;
            warnings.push("Low confidence match. Review recommended.");
        }
    }

    confidence = Math.max(0, parseFloat(confidence.toFixed(2)));

    // 5. Construct Result Contract (Section 9)
    return {
        agent: "cpt",
        status: "completed",
        requestId: taskContext.requestId || `REQ-${Date.now()}`,
        result: primaryCpt ? {
            primaryCpt,
            alternatives,
            evidence: candidates[0].evidence
        } : null,
        confidence,
        warnings,
        requiresHumanReview,
        nextRecommendedAgents: ["cost", "orTime", "staff"]
    };
};
