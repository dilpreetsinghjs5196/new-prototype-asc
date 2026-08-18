# New ASC Prototype --- Multi-Agent AI Master Workflow

## 1. Purpose

This is the master architecture and routing document for the New ASC
Prototype multi-agent AI system.

The system contains eight specialized agents coordinated by one central
**Agent Orchestrator**.

### Agents

1.  Patient Intake & Data Agent
2.  CPT Codes Agent
3.  Cost Agent
4.  Staff Agent
5.  OR Time Agent
6.  Scheduling Agent
7.  OR Optimization Agent
8.  Billing Agent

The Patient Agent is intentionally called **Patient Intake & Data
Agent**, not Patient Upload Agent.

Patient data can enter the system through:

-   External/API integration
-   Manual Patient Create Form

Both sources must pass through the same patient intake, validation,
normalization and duplicate-detection workflow.

------------------------------------------------------------------------

# 2. Core Architecture

``` text
                         USER / EXTERNAL SYSTEM
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
             External API                 Manual Patient Form
                    |                           |
                    +-------------+-------------+
                                  |
                                  v
                    +---------------------------+
                    | Patient Intake & Data     |
                    | Agent                     |
                    +-------------+-------------+
                                  |
                                  v
                       Standard Patient Context
                                  |
                                  v
                    +---------------------------+
                    |    Agent Orchestrator     |
                    +-------------+-------------+
                                  |
                 +----------------+----------------+
                 |                |                |
                 v                v                v
              CPT Agent       Cost Agent       Staff Agent
                 |                |                |
                 +----------------+----------------+
                                  |
                                  v
                           OR Time Agent
                                  |
                                  v
                         Scheduling Agent
                                  |
                                  v
                     OR Optimization Agent
                                  |
                                  v
                           Billing Agent
                                  |
                                  v
                           Validation
                                  |
                                  v
                          Human Approval
                                  |
                                  v
                         Supabase / Systems
```

The orchestrator does not perform every business operation itself. It
coordinates specialized agents and tools.

------------------------------------------------------------------------

# 3. Master Routing Rule

For every request:

1.  Read project-level rules.
2.  Understand the requested task.
3.  Identify the minimum required agents.
4.  Load the relevant agent specification.
5.  Create agent tasks.
6.  Respect dependencies.
7.  Run independent agents in parallel when possible.
8.  Store results in shared structured context.
9.  Validate results.
10. Trigger additional agents if required.
11. Request human approval when required.
12. Commit approved changes through controlled services.

Do not automatically execute all eight agents for every request.

------------------------------------------------------------------------

# 4. Agent Registry

  -----------------------------------------------------------------------------------
  Agent                   Specification                       Responsibility
  ----------------------- ----------------------------------- -----------------------
  Patient Intake & Data   `agents/patient-intake-agent.md`    Receive, validate,
                                                              normalize and prepare
                                                              patient data

  CPT Codes               `agents/cpt-codes-agent.md`         Identify and validate
                                                              CPT codes

  Cost                    `agents/cost-agent.md`              Analyze tray, implant,
                                                              supply, labor and OR
                                                              costs

  Staff                   `agents/staff-agent.md`             Determine staff
                                                              requirements and
                                                              availability

  OR Time                 `agents/or-time-agent.md`           Calculate procedure and
                                                              OR occupancy time

  Scheduling              `agents/scheduling-agent.md`        Generate feasible
                                                              surgery schedules

  OR Optimization         `agents/or-optimization-agent.md`   Optimize schedules
                                                              against constraints and
                                                              objectives

  Billing                 `agents/billing-agent.md`           Validate billing,
                                                              charges and expected
                                                              financial results
  -----------------------------------------------------------------------------------

------------------------------------------------------------------------

# 5. Patient Intake & Data Agent

## Purpose

This agent is the standard entry point for patient information.

It accepts patient information from:

### Source A --- External API

``` text
External System
      ↓
API
      ↓
Patient Intake & Data Agent
```

### Source B --- Manual Patient Create Form

``` text
ASC Staff
   ↓
Patient Create Form
   ↓
Patient Intake & Data Agent
```

Both sources must produce the same standardized patient context.

## Responsibilities

-   Receive patient data
-   Identify source
-   Validate required fields
-   Normalize data formats
-   Check duplicate patients
-   Compare with existing patient records
-   Detect conflicting information
-   Prepare a standardized patient context
-   Identify missing information
-   Enrich context using approved data sources
-   Route procedure/coding questions to the CPT Agent

## Important Boundary

The Patient Agent owns patient intake and data quality.

It does not become the final authority for CPT coding, billing, OR
scheduling or clinical decisions.

## Example Output

``` json
{
  "patient": {
    "id": "PAT-1001",
    "firstName": "John",
    "lastName": "Smith",
    "dob": "1965-04-12"
  },
  "source": {
    "type": "api",
    "sourceSystem": "External Hospital System"
  },
  "validation": {
    "valid": true,
    "missingFields": [],
    "conflicts": []
  },
  "duplicateCheck": {
    "possibleDuplicate": false,
    "confidence": 0.98
  },
  "procedure": {
    "description": "Total Knee Replacement"
  },
  "confidence": 0.97,
  "requiresHumanReview": false
}
```

For manual form input:

``` json
{
  "source": {
    "type": "manual_form"
  }
}
```

The downstream agents do not need different workflows based on the
source.

------------------------------------------------------------------------

# 6. Standard Agent Communication

Agents must not communicate through uncontrolled free-form
conversations.

Use:

``` text
Agent
  ↓
Structured Result
  ↓
Shared Context
  ↓
Orchestrator
  ↓
Next Agent Task
  ↓
Next Agent
```

This provides:

-   Traceability
-   Validation
-   Retry
-   Auditing
-   Debugging
-   Clear responsibility
-   Controlled permissions

------------------------------------------------------------------------

# 7. Shared Agent Context

Every request receives a shared context.

``` json
{
  "requestId": "REQ-1001",
  "source": {
    "type": "manual_form"
  },
  "patient": {},
  "procedure": {},
  "cpt": {},
  "costs": {},
  "staff": {},
  "orTime": {},
  "schedule": {},
  "optimization": {},
  "billing": {},
  "warnings": [],
  "agentHistory": [],
  "approvals": []
}
```

Each agent should primarily update its own section.

------------------------------------------------------------------------

# 8. Agent Task Contract

``` json
{
  "taskId": "TASK-1001",
  "requestId": "REQ-1001",
  "agent": "cpt",
  "action": "identify_cpt",
  "status": "pending",
  "input": {},
  "dependsOn": []
}
```

Task states:

``` text
pending → running → completed
pending → running → failed → retry
pending → blocked → human review
```

------------------------------------------------------------------------

# 9. Agent Result Contract

``` json
{
  "agent": "cpt",
  "status": "completed",
  "requestId": "REQ-1001",
  "result": {},
  "confidence": 0.96,
  "warnings": [],
  "requiresHumanReview": false,
  "nextRecommendedAgents": []
}
```

------------------------------------------------------------------------

# 10. Complete Patient-to-Billing Workflow

``` text
Patient Data Source
       |
       +---- External API
       |
       +---- Manual Patient Create Form
       |
       v
Patient Intake & Data Agent
       |
       +-- Validate
       +-- Normalize
       +-- Duplicate Check
       +-- Conflict Check
       +-- Standardize
       |
       v
Standard Patient Context
       |
       v
CPT Codes Agent
       |
       v
CPT Result
       |
       +------------------+------------------+
       |                  |                  |
       v                  v                  v
   Cost Agent        Staff Agent        OR Time Agent
       |                  |                  |
       +------------------+------------------+
                          |
                          v
                  Scheduling Agent
                          |
                          v
                OR Optimization Agent
                          |
                          v
                     Billing Agent
                          |
                          v
                     Validation
                          |
                          v
                  Human Approval
                          |
                          v
                  Final Database Commit
```

------------------------------------------------------------------------

# 11. Parallel Execution

After CPT information is available, Cost, Staff and OR Time can often
run independently.

``` text
                 CPT
                  |
        +---------+---------+
        |         |         |
        v         v         v
      Cost      Staff     OR Time
        |         |         |
        +---------+---------+
                  |
                  v
             Scheduling
                  |
                  v
             Optimization
```

Use parallel execution only when dependencies allow it.

------------------------------------------------------------------------

# 12. CPT Codes Agent

Responsibilities:

-   Search CPT registry
-   Match procedure descriptions
-   Consider body part and procedure information
-   Use historical surgeon information
-   Rank candidates
-   Identify ambiguity
-   Return confidence and warnings

Existing services that can be reused:

``` text
CPTIntelligence.js
SurgeonIntelligence.js
HistoricalIntelligence.js
```

The CPT Agent provides recommendations; final coding authority remains
with approved business/clinical workflows.

------------------------------------------------------------------------

# 13. Cost Agent

Responsibilities:

-   Tray cost
-   Implant cost
-   Supply cost
-   Labor cost
-   OR/room cost
-   Procedure total cost
-   Margin impact
-   Cost comparisons

Reuse existing cost data and `hospitalUtils`/financial services where
applicable.

Exact financial calculations should be deterministic.

------------------------------------------------------------------------

# 14. Staff Agent

Responsibilities:

-   Determine required roles
-   Check staff availability
-   Check skills
-   Detect conflicts
-   Identify overtime risk
-   Provide staffing recommendations

Hard staffing constraints must not be overridden by AI.

------------------------------------------------------------------------

# 15. OR Time Agent

Responsibilities:

-   Procedure duration
-   Setup time
-   Anesthesia time
-   Turnover time
-   Cleaning time
-   Total OR occupancy
-   Historical duration comparison

Exact time calculations should use configured business rules and
historical data.

------------------------------------------------------------------------

# 16. Scheduling Agent

Responsibilities:

-   Generate feasible surgery schedule candidates
-   Check patient availability
-   Check surgeon availability
-   Check OR availability
-   Check staff availability
-   Check procedure duration
-   Check equipment/room requirements
-   Detect conflicts

The Scheduling Agent generates feasible candidates.

The Optimization Agent determines which candidate best satisfies the
defined objectives.

------------------------------------------------------------------------

# 17. OR Optimization Agent

Responsibilities:

-   Compare schedule candidates
-   Maximize OR utilization
-   Improve margin/profit
-   Reduce overtime
-   Improve staff efficiency
-   Reduce turnover waste
-   Respect surgeon preferences
-   Respect operational constraints

### Hard Constraints

Must never be violated:

``` text
OR unavailable
Surgeon unavailable
Staff unavailable
Patient unavailable
Overlapping cases
Room incompatibility
Required equipment unavailable
Capacity exceeded
```

### Soft Objectives

Can be optimized:

``` text
Preferred OR
Preferred surgeon day
Higher margin
Higher utilization
Lower overtime
Better turnover
```

Reuse:

``` text
OptimizationEngine.js
PredictionEngine.js
ScenarioGenerator.js
FinancialEngine.js
SurgeonIntelligence.js
HistoricalIntelligence.js
```

For complex scheduling, use a dedicated optimization/constraint solver
rather than relying on Gemini for exact combinatorial optimization.

------------------------------------------------------------------------

# 18. Billing Agent

Responsibilities:

-   Validate CPT/charge relationships
-   Review insurance information
-   Check fee schedule
-   Estimate expected reimbursement
-   Review costs and financial impact
-   Identify missing billing information
-   Flag potential billing issues

Exact financial calculations should be deterministic.

------------------------------------------------------------------------

# 19. AI vs Deterministic Responsibilities

## AI/Gemini

Use for:

-   Document understanding
-   Classification
-   Reasoning
-   Natural-language interaction
-   Recommendations
-   Explanations
-   Scenario analysis
-   Summaries

## Deterministic Application Services

Use for:

-   Database queries
-   Exact financial calculations
-   Exact time calculations
-   Availability
-   Conflict detection
-   CPT registry lookup
-   Business formulas
-   Hard constraints
-   Database writes

## Optimization Engine

Use for:

-   Constraint satisfaction
-   Schedule combinations
-   Capacity
-   Utilization
-   Multi-objective optimization

------------------------------------------------------------------------

# 20. Tools Layer

Agents should use dedicated tools instead of putting all database logic
inside the agents.

``` text
src/agent-tools/
├── PatientTools.js
├── CPTTools.js
├── CostTools.js
├── StaffTools.js
├── ORTools.js
├── SchedulingTools.js
└── BillingTools.js
```

Example:

``` text
OR Time Agent
      ↓
ORTools
      ↓
Supabase / Business Services
      ↓
Result
```

------------------------------------------------------------------------

# 21. Existing AI Operations Integration

Existing services should be reused.

``` text
CPT Agent
  ├── CPTIntelligence
  ├── SurgeonIntelligence
  └── HistoricalIntelligence

OR Optimization Agent
  ├── OptimizationEngine
  ├── PredictionEngine
  ├── ScenarioGenerator
  ├── FinancialEngine
  ├── SurgeonIntelligence
  └── HistoricalIntelligence
```

Do not duplicate existing business logic without checking the current
implementation first.

------------------------------------------------------------------------

# 22. Human Approval

For important operations:

``` text
AI Analysis
   ↓
Recommendation
   ↓
Validation
   ↓
Human Review
   ↓
Approve / Modify / Reject
   ↓
Controlled Database Commit
```

Especially for:

-   Patient data changes
-   Clinical/coding decisions
-   OR schedule changes
-   High-value implant decisions
-   Billing/claim-related actions

------------------------------------------------------------------------

# 23. Supabase Agent Tables

Recommended:

### `agent_runs`

``` text
id
request_id
agent_name
status
input_data
output_data
confidence
started_at
completed_at
error
```

### `agent_tasks`

``` text
id
request_id
parent_task_id
agent_name
action
depends_on
status
input_data
output_data
created_at
completed_at
```

### `agent_events`

``` text
id
request_id
source_agent
target_agent
event_type
payload
created_at
```

### `agent_context`

``` text
id
request_id
patient_id
surgery_id
context_json
version
updated_at
```

### `agent_approvals`

``` text
id
request_id
agent_name
decision
approved_by
comments
approved_at
```

### `agent_errors`

``` text
id
request_id
agent_name
error_type
error_message
payload
created_at
```

------------------------------------------------------------------------

# 24. Error and Confidence Handling

Example:

``` text
CPT confidence = 0.58
        ↓
Below configured threshold
        ↓
Human Review
        ↓
Confirmed
        ↓
Continue
```

Agent failures:

``` text
Agent
 ↓
Failed
 ↓
Retry
 ↓
Alternative method
 ↓
Still failed?
 ↓
Human Review
```

------------------------------------------------------------------------

# 25. Dynamic Agent Selection

Only use the agents needed for a task.

Example:

``` text
"Check staff availability."
        ↓
Staff Agent
```

``` text
"Calculate implant cost."
        ↓
Cost Agent
```

``` text
"Optimize tomorrow's OR schedule."
        ↓
Staff
OR Time
Cost
Scheduling
OR Optimization
```

------------------------------------------------------------------------

# 26. Recommended Project Structure

``` text
src/
├── agents/
│   ├── AgentOrchestrator.js
│   ├── AgentRegistry.js
│   ├── AgentRunner.js
│   ├── AgentContext.js
│   ├── AgentTaskManager.js
│   │
│   ├── patient/
│   │   └── PatientIntakeAgent.js
│   ├── cpt/
│   ├── cost/
│   ├── staff/
│   ├── orTime/
│   ├── scheduling/
│   ├── optimization/
│   └── billing/
│
├── agent-tools/
├── services/
│   ├── aiOperations/
│   ├── supabase.js
│   └── gemini.js
│
└── components/

docs/
├── project.md
└── agents/
```

------------------------------------------------------------------------

# 27. Golden Rule

``` text
AI THINKS
    ↓
TOOLS FETCH / CALCULATE
    ↓
AGENT RECOMMENDS
    ↓
VALIDATOR CHECKS
    ↓
HUMAN APPROVES
    ↓
DATABASE COMMITS
```

Never:

``` text
AI
 ↓
Unrestricted direct database modification
```

------------------------------------------------------------------------

# 28. Final Mental Model

``` text
project.md
     ↓
Agent Orchestrator
     ↓
Specialized Agent
     ↓
Agent Tools / Existing Services
     ↓
Supabase / External Systems
     ↓
Structured Result
     ↓
Orchestrator
     ↓
Next Agent
     ↓
Validation
     ↓
Human Approval
     ↓
Final Commit
```

The Patient Intake & Data Agent is the entry point for patient
information, regardless of whether the data originates from an API or
the manual Patient Create Form.


---

# 29. Gemini API and Multi-Agent Model

## Is one Gemini API key enough?

Yes.

The system does **not** require a separate Gemini API key for every agent.

A single Gemini API configuration can be shared by all logical agents:

```text
                    Gemini API Key
                          |
                          v
                 Agent Orchestrator
                          |
        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
   Patient Agent      CPT Agent        Cost Agent
        |                 |                 |
        +-----------------+-----------------+
                          |
             +------------+------------+
             |            |            |
             v            v            v
        Staff Agent   OR Time Agent  Scheduling
                                          |
                                          v
                                OR Optimization
                                          |
                                          v
                                      Billing
```

The agents are **logical application-level agents**. They do not need separate Gemini accounts or keys.

## What Gemini provides

Gemini provides the AI/model layer for tasks such as:

- Natural-language understanding
- Document understanding
- Information extraction
- Classification
- Reasoning
- Recommendations
- Scenario analysis
- Explanations
- Conversational responses

## What the application provides

The application creates the actual multi-agent architecture:

```text
Gemini API
    ↓
Agent Orchestrator
    ↓
Agent Registry
    ↓
Agent Instructions
    ↓
Agent Context
    ↓
Agent Tasks
    ↓
Agent Tools
    ↓
Supabase / Existing Services
```

Therefore:

```text
Gemini API
= AI model / reasoning capability

Your application
= Multi-agent system / orchestration / business workflow
```

## Do not let Gemini perform everything

The ASC system should separate AI reasoning from deterministic operations.

### Gemini should handle

```text
Understand
Extract
Classify
Reason
Recommend
Explain
Summarize
Analyze scenarios
```

### Application code / services should handle

```text
Database queries
Exact calculations
Exact costs
Exact time
Patient record operations
CPT registry lookup
Staff availability
OR availability
Conflict detection
Financial formulas
Hard business rules
Database writes
```

### Optimization engine should handle

```text
Capacity
Hard constraints
Schedule combinations
Utilization
Multi-objective optimization
```

Gemini can explain and reason about optimization results, but exact scheduling optimization should be handled by deterministic optimization/constraint logic.

## One Gemini Key, Multiple Logical Agents

Example:

```text
lib/gemini.js
       ↓
Gemini Client
       ↓
Agent Orchestrator
       |
       +── Patient Intake Agent
       +── CPT Agent
       +── Cost Agent
       +── Staff Agent
       +── OR Time Agent
       +── Scheduling Agent
       +── OR Optimization Agent
       +── Billing Agent
```

Each agent uses different instructions and tools.

For example:

```text
Patient Agent
 → patient-intake-agent.md

CPT Agent
 → cpt-codes-agent.md

Cost Agent
 → cost-agent.md
```

The model can be the same while the agent's:

- Role
- Instructions
- Context
- Allowed tools
- Validation rules
- Output schema

are different.

## Security

The Gemini API key should be protected.

Do not expose a production Gemini API key directly in frontend code.

Prefer:

```text
React Frontend
      ↓
Secure Backend / Server Function
      ↓
Gemini API
```

For development, the existing Gemini integration can be reused, but production credentials should be protected with server-side secrets.

## Scaling Later

One Gemini key is sufficient for the initial multi-agent prototype.

As the system grows, you can introduce:

- Separate API projects
- Separate quotas
- Different Gemini models for different workloads
- Usage monitoring
- Rate limiting
- Retry/fallback logic
- Server-side caching
- Cost controls

This does not change the logical agent architecture.

## Existing Project Integration

The existing:

```text
lib/gemini.js
lib/geminiLive.js
services/aiOperations/
```

can become the foundation for the new agent system.

Do not create eight separate Gemini integrations unnecessarily.

Instead:

```text
Existing Gemini Client
        ↓
Agent Orchestrator
        ↓
Specialized Agents
```

This keeps the system simpler, cheaper and easier to maintain.
