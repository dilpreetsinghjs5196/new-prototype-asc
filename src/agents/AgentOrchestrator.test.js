import { AgentOrchestrator } from './AgentOrchestrator.js';

// Mock database lists for test verification
const mockCPTRegistry = [
    { code: '27130', description: 'Total Knee Replacement', category: 'Orthopedics', gross_charge: 22125, cost: 11000, average_duration: 120 },
    { code: '29827', description: 'Knee Scope / Arthroscopy', category: 'Orthopedics', gross_charge: 12842, cost: 5219, average_duration: 60 }
];

const mockSurgeriesList = [
    { id: 1, doctor: 'Dr. Malinoski Kelly', cpt_codes: '27130', duration_minutes: 120, turnover_time: 18, expected_reimbursement: 22125, supplies_cost: 4800, implants_cost: 6200, actual_labor_cost: 1800, actual_room_cost: 1360 }
];

async function runOrchestratorTest() {
    console.log("=================================================");
    console.log("STARTING MULTI-AGENT ORCHESTRATOR PIPELINE TEST");
    console.log("=================================================\n");

    // 1. Initialize Orchestrator
    const orchestrator = new AgentOrchestrator('REQ-TEST-001', 'api');

    // 2. Define Tasks matching dependencies:
    // patient (no deps) -> cpt (depends on patient) -> cost & orTime (depend on cpt) -> billing (depends on cost)
    const tasks = [
        {
            taskId: 'TASK-01',
            agent: 'patient',
            action: 'intake',
            patient: { name: 'Doe John', mrn: 'MRN-9021', id: 'PAT-902' },
            dependsOn: []
        },
        {
            taskId: 'TASK-02',
            agent: 'cpt',
            action: 'identify_cpt',
            procedure: { description: 'Total Knee Replacement' },
            dependsOn: ['patient']
        },
        {
            taskId: 'TASK-03',
            agent: 'cost',
            action: 'calculate_costs',
            input: { grossCharge: 22125, durationMinutes: 120, suppliesCost: 4800, implantCost: 6200 },
            dependsOn: ['cpt']
        },
        {
            taskId: 'TASK-04',
            agent: 'orTime',
            action: 'predict_duration',
            cptCode: { code: '27130', average_duration: 120 },
            dependsOn: ['cpt']
        },
        {
            taskId: 'TASK-05',
            agent: 'billing',
            action: 'verify_billing',
            billedAmount: 22125,
            dependsOn: ['cost']
        }
    ];

    // 3. Execution System Context
    const systemContext = {
        cptCodes: mockCPTRegistry,
        surgeries: mockSurgeriesList,
        historicalAvg: { '27130': 120 }
    };

    console.log("Executing Tasks:\n", tasks.map(t => ` - ${t.taskId}: ${t.agent} (${t.action})`).join('\n'));
    console.log("\nRunning Orchestrator pipeline...");

    try {
        const finalContext = await orchestrator.executePipeline(tasks, systemContext);

        console.log("\n=================================================");
        console.log("PIPELINE RUN COMPLETED SUCCESSFULLY");
        console.log("=================================================\n");

        console.log("Context Results:");
        console.log(" - Request ID:", finalContext.requestId);
        console.log(" - Source:", finalContext.source.type);
        console.log(" - Patient:", finalContext.patient);
        console.log(" - CPT Assigned:", finalContext.cpt);
        console.log(" - Costs Calculated:", finalContext.costs);
        console.log(" - OR Time Predicted:", finalContext.orTime);
        console.log(" - Billing State:", finalContext.billing);
        console.log(" - Global Warnings:", finalContext.warnings);

        console.log("\nAgent History Logs (Audit Trail):");
        finalContext.agentHistory.forEach(h => {
            console.log(` [${h.timestamp}] Agent: ${h.agentName} | Status: ${h.status} ${h.error ? `| Error: ${h.error}` : ''}`);
        });

    } catch (e) {
        console.error("Pipeline test crashed:", e);
    }
}

runOrchestratorTest();
