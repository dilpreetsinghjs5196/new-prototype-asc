/**
 * Agent Context Manager
 * Represents the shared structured context contract between logical agents.
 * Following the schema in Section 7 of agent/project.md
 */
export class AgentContext {
    constructor(requestId, sourceType = 'manual_form') {
        this.context = {
            requestId: requestId || `REQ-${Date.now()}`,
            source: {
                type: sourceType // 'manual_form' or 'api'
            },
            patient: {},
            procedure: {},
            cpt: {},
            costs: {},
            staff: {},
            orTime: {},
            schedule: {},
            optimization: {},
            billing: {},
            warnings: [],
            agentHistory: [],
            approvals: []
        };
    }

    // Update specific keys in the context contract
    update(key, data) {
        const validKeys = [
            'patient', 'procedure', 'cpt', 'costs', 'staff', 
            'orTime', 'schedule', 'optimization', 'billing'
        ];

        if (!validKeys.includes(key)) {
            throw new Error(`Invalid context key: "${key}". Must be one of: ${validKeys.join(', ')}`);
        }

        this.context[key] = {
            ...this.context[key],
            ...data
        };
    }

    // Add general execution warning
    addWarning(warning) {
        if (warning && !this.context.warnings.includes(warning)) {
            this.context.warnings.push(warning);
        }
    }

    // Add agent history audit trail (Section 23 schema recommendation)
    recordHistory(agentName, status, resultData, error = null) {
        this.context.agentHistory.push({
            agentName,
            status, // 'completed', 'failed', 'pending'
            timestamp: new Date().toISOString(),
            output: resultData,
            error: error ? error.message || String(error) : null
        });
    }

    // Record human approval or validation decision
    recordApproval(agentName, decision, approvedBy, comments = '') {
        this.context.approvals.push({
            agentName,
            decision, // 'approved', 'rejected', 'modified'
            approvedBy,
            comments,
            approvedAt: new Date().toISOString()
        });
    }

    // Retrieve entire context JSON
    getContextJson() {
        return { ...this.context };
    }
}
