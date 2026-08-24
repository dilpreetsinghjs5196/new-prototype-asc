import { executePatientIntake } from './patient/PatientIntakeAgent.js';
import { executeCPTTask } from './CPTAgent.js';
import { executeCostTask } from './cost/CostAgent.js';
import { executeStaffTask } from './staff/StaffAgent.js';
import { executeORTimeTask } from './orTime/ORTimeAgent.js';
import { executeSchedulingTask } from './scheduling/SchedulingAgent.js';
import { executeOROptimizationTask } from './optimization/OROptimizationAgent.js';
import { executeBillingTask } from './billing/BillingAgent.js';

/**
 * Agent Registry Module
 * Maps agent keys to their execution handlers.
 * Exposes logical agent contracts for multi-agent scheduling.
 */
export const AgentRegistry = {
    // 1. Patient Intake & Data Agent
    async patient(taskContext, systemContext) {
        return await executePatientIntake(taskContext, systemContext);
    },

    // 2. CPT Codes Agent
    async cpt(taskContext, systemContext) {
        return await executeCPTTask(taskContext, systemContext);
    },

    // 3. Cost Agent
    async cost(taskContext, systemContext) {
        return await executeCostTask(taskContext, systemContext);
    },

    // 4. Staff Agent
    async staff(taskContext, systemContext) {
        return await executeStaffTask(taskContext, systemContext);
    },

    // 5. OR Time Agent
    async orTime(taskContext, systemContext) {
        return await executeORTimeTask(taskContext, systemContext);
    },

    // 6. Scheduling Agent
    async scheduling(taskContext, systemContext) {
        return await executeSchedulingTask(taskContext, systemContext);
    },

    // 7. OR Optimization Agent
    async optimization(taskContext, systemContext) {
        return await executeOROptimizationTask(taskContext, systemContext);
    },

    // 8. Billing Agent
    async billing(taskContext, systemContext) {
        return await executeBillingTask(taskContext, systemContext);
    }
};

/**
 * Checks if an agent is supported by the registry
 */
export const isAgentSupported = (agentName) => {
    return typeof AgentRegistry[agentName] === 'function';
};
