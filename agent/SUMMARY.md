# New ASC Prototype --- Multi-Agent Workflow Summary

## Core Idea

The system uses one **Agent Orchestrator** to coordinate eight
specialized AI agents.

``` text
User / External System
        ↓
Patient Intake & Data
        ↓
Agent Orchestrator
        ↓
Required Specialized Agents
        ↓
Validation
        ↓
Human Approval
        ↓
Supabase / External Systems
```

## Eight Agents

  -----------------------------------------------------------------------
  Agent                               Purpose
  ----------------------------------- -----------------------------------
  Patient Intake & Data               Receives patient data from API or
                                      manual Patient Create Form,
                                      validates, normalizes and checks
                                      duplicates

  CPT Codes                           Identifies and validates CPT codes

  Cost                                Analyzes tray, implant, supply,
                                      labor and OR costs

  Staff                               Checks required staff, skills and
                                      availability

  OR Time                             Calculates procedure and OR
                                      occupancy time

  Scheduling                          Creates feasible schedule options

  OR Optimization                     Finds the best schedule

  Billing                             Validates charges, reimbursement
                                      and billing information
  -----------------------------------------------------------------------

## Patient Data Entry

The Patient Agent has two input channels:

``` text
External API ──────────┐
                       ├──> Patient Intake & Data Agent
Manual Patient Form ───┘
```

Both become the same standardized patient context.

The Patient Agent handles:

-   Validation
-   Normalization
-   Duplicate detection
-   Conflict detection
-   Missing information
-   Standard patient context

It does not own CPT, billing, scheduling or optimization decisions.

## Main Workflow

``` text
API / Manual Form
       ↓
Patient Intake & Data Agent
       ↓
CPT Codes Agent
       ↓
 ┌─────┼─────┐
 ↓     ↓     ↓
Cost Staff OR Time
 └─────┼─────┘
       ↓
Scheduling Agent
       ↓
OR Optimization Agent
       ↓
Billing Agent
       ↓
Validation
       ↓
Human Approval
       ↓
Database Commit
```

## Agent Communication

Agents do not use uncontrolled agent-to-agent chat.

They communicate using:

``` text
Agent
 ↓
Structured Result
 ↓
Shared Context
 ↓
Orchestrator
 ↓
Next Task
 ↓
Next Agent
```

Shared context contains:

``` text
patient
procedure
cpt
costs
staff
orTime
schedule
optimization
billing
warnings
agentHistory
approvals
```

## Parallel Work

After CPT is ready:

``` text
CPT
 ↓
 ┌──────────────┬──────────────┐
 ↓              ↓              ↓
Cost           Staff         OR Time
 └──────────────┴──────────────┘
                ↓
           Scheduling
                ↓
          Optimization
```

Independent agents can run in parallel.

## Gemini vs Application Logic

### Gemini

-   Document understanding
-   Reasoning
-   Classification
-   Recommendations
-   Explanations
-   Scenario analysis

### Deterministic code

-   Exact calculations
-   Database queries
-   CPT lookup
-   Availability
-   Conflict detection
-   Financial formulas
-   Hard constraints
-   Database writes

### Optimization engine

-   Capacity
-   Schedule combinations
-   Constraint solving
-   Utilization
-   Multi-objective optimization

## Human Approval

``` text
AI Recommendation
 ↓
Validation
 ↓
Human Review
 ↓
Approve / Modify / Reject
 ↓
Controlled Commit
```

## Final Mental Model

``` text
project.md
   ↓
Agent Orchestrator
   ↓
Specialized Agents
   ↓
Tools / Existing Services
   ↓
Supabase / External APIs
   ↓
Structured Results
   ↓
Next Agent
   ↓
Validation
   ↓
Human Approval
```

## Golden Rule

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

This is the recommended foundation for the New ASC Prototype multi-agent
system.


## Gemini API Key

A single Gemini API key is sufficient for the initial multi-agent architecture.

You do **not** need one Gemini API key per agent.

```text
Gemini API
    ↓
Agent Orchestrator
    ↓
Patient / CPT / Cost / Staff / OR Time /
Scheduling / Optimization / Billing Agents
```

The important distinction is:

```text
Gemini API
= AI model / reasoning layer

Your application
= Multi-agent architecture
```

Each logical agent can use the same Gemini client while having different:

- Instructions
- Context
- Tools
- Permissions
- Output schemas
- Validation rules

### Gemini should handle

- Understanding
- Extraction
- Classification
- Reasoning
- Recommendations
- Explanations
- Scenario analysis

### Application/services should handle

- Database queries
- Exact costs
- Exact time
- CPT lookup
- Availability
- Conflict detection
- Financial formulas
- Hard business rules
- Database writes

### Optimization engine should handle

- Capacity
- Hard constraints
- Schedule combinations
- Utilization
- Multi-objective optimization

For production, protect the Gemini API key on the server/backend rather than exposing it directly in the React frontend.

The existing `lib/gemini.js`, `lib/geminiLive.js`, and `services/aiOperations/` can be reused as the foundation rather than creating eight separate Gemini integrations.
