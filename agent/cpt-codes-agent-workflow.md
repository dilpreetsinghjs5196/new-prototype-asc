# CPT Codes Agent --- Workflow Specification

## 1. Purpose

The **CPT Codes Agent** is a specialized AI agent in the New ASC
Prototype.

Its job is to analyze a standardized patient/procedure context, identify
appropriate CPT code candidates, validate them against the ASC CPT
registry and available historical intelligence, and return a structured
recommendation for downstream agents.

The CPT Agent does not directly control scheduling, billing submission,
or irreversible database changes.

------------------------------------------------------------------------

## 2. Position in the Multi-Agent Workflow

``` text
Patient Data
    |
    +----------------------+
    |                      |
    v                      v
External API        Manual Patient Create Form
    |                      |
    +----------+-----------+
               |
               v
   Patient Intake & Data Agent
               |
               v
      Standard Patient Context
               |
               v
        Agent Orchestrator
               |
               v
        CPT Codes Agent
               |
       +-------+-------+
       |       |       |
       v       v       v
     Cost    Staff   OR Time
       |       |       |
       +-------+-------+
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
```

The CPT Agent is an important decision/input agent, not a standalone
chatbot.

------------------------------------------------------------------------

## 3. What Triggers the CPT Agent?

The Agent Orchestrator can trigger the CPT Agent when:

### New patient/procedure

``` text
Patient Create Form
        ↓
Patient Intake Agent
        ↓
Procedure available
        ↓
CPT Agent
```

### API patient data

``` text
External API
     ↓
Patient Intake Agent
     ↓
Procedure available
     ↓
CPT Agent
```

### Procedure changed

``` text
Existing Surgery
      ↓
Procedure Changed
      ↓
CPT Agent
```

### Explicit CPT request

Example:

> Find the appropriate CPT codes for this procedure.

### Scheduling dependency

If a scheduling workflow requires current CPT information and it is
missing or outdated, the Orchestrator can call the CPT Agent.

------------------------------------------------------------------------

## 4. CPT Agent Inputs

The CPT Agent receives structured context:

``` json
{
  "requestId": "REQ-1001",
  "patient": {
    "id": "PAT-1001"
  },
  "procedure": {
    "description": "Total Knee Replacement",
    "bodyPart": "Knee",
    "laterality": "Left"
  },
  "diagnosis": [],
  "surgeon": {
    "id": "SURG-1001"
  },
  "context": {
    "facility": "ASC",
    "dateOfService": "..."
  }
}
```

The exact fields should match the application's existing schema.

------------------------------------------------------------------------

## 5. Source Priority

Use controlled source priority:

``` text
1. Current authorized CPT Registry
        ↓
2. Current coding/ASC rules
        ↓
3. Procedure and clinical context
        ↓
4. Historical CPT usage
        ↓
5. Surgeon historical usage
        ↓
6. AI reasoning
```

The AI must not invent a CPT code that is not found in the authorized
CPT source.

If no reliable match exists, return a controlled "no reliable match"
result and request review.

------------------------------------------------------------------------

## 6. Existing Services to Reuse

The current project already contains:

``` text
CPTIntelligence.js
SurgeonIntelligence.js
HistoricalIntelligence.js
```

Reuse these services where appropriate.

### CPTIntelligence

Use for CPT lookup, matching and CPT characteristics.

### SurgeonIntelligence

Use for surgeon-specific historical CPT/procedure patterns.

### HistoricalIntelligence

Use for previous procedures, CPT usage and historical operational
patterns.

Inspect the current implementations before duplicating functionality.

------------------------------------------------------------------------

## 7. Processing Workflow

### Step 1 --- Receive Task

``` json
{
  "taskId": "TASK-CPT-001",
  "requestId": "REQ-1001",
  "agent": "cpt",
  "action": "identify_cpt",
  "status": "pending"
}
```

### Step 2 --- Read Shared Context

Read:

-   Procedure
-   Diagnosis
-   Body part
-   Laterality when relevant
-   Surgeon
-   Facility context
-   Date of service

### Step 3 --- Validate Required Information

Check whether enough information exists.

``` text
Procedure       ✓
Body part       ✓
Laterality      ✓
Diagnosis       ✓
Surgeon         ✓
```

If critical information is missing, do not guess.

``` text
CPT Agent
   ↓
Missing Information
   ↓
Human Review / Additional Information
```

### Step 4 --- Search CPT Registry

``` text
Procedure Description
        ↓
CPT Registry Search
        ↓
Candidate CPTs
```

### Step 5 --- Filter Candidates

Filter by:

-   Procedure match
-   Body part
-   Laterality where applicable
-   Procedure type
-   Current status
-   Applicable coding/business rules

### Step 6 --- Historical Intelligence

Compare candidates against:

-   Facility historical usage
-   Surgeon historical usage
-   Similar procedures
-   Historical frequency

Historical usage supports a recommendation but must not override current
coding rules.

### Step 7 --- Score Candidates

Use a configurable scoring model.

Example:

``` text
Procedure Match       40%
Body Part Match       20%
Coding Context        15%
Historical Evidence   10%
Surgeon History       10%
Data Confidence        5%
```

Example:

``` text
Candidate A → 94%
Candidate B → 72%
Candidate C → 41%
```

Exact scoring should be implemented deterministically where possible.

### Step 8 --- Gemini Reasoning

Gemini may help interpret ambiguous procedure descriptions and explain
candidate differences.

Example:

``` text
Procedure Text
     ↓
Gemini interpretation
     ↓
Structured procedure meaning
     ↓
CPT Registry Tool
     ↓
Candidate codes
```

Gemini should never create an unverified CPT code.

### Step 9 --- Validate

Before returning:

``` text
Candidate
   ↓
Exists in registry?
   ↓
Active/current?
   ↓
Procedure compatible?
   ↓
Required information available?
   ↓
Business rules satisfied?
```

### Step 10 --- Confidence

Return confidence with the result.

Example:

``` json
{
  "confidence": 0.94
}
```

Recommended configurable bands:

``` text
0.90–1.00 → High
0.75–0.89 → Medium
Below 0.75 → Review recommended
```

Confidence is an indicator, not proof of coding correctness.

------------------------------------------------------------------------

## 8. Human Review

Trigger review when:

-   No strong CPT match exists
-   Multiple candidates remain ambiguous
-   Required information is missing
-   Registry validation fails
-   Confidence is below threshold
-   Coding/business rules conflict
-   User requests review

Example:

``` text
CPT Agent
    ↓
Confidence 0.61
    ↓
Human Review Required
```

------------------------------------------------------------------------

## 9. Standard Output

``` json
{
  "agent": "cpt",
  "status": "completed",
  "requestId": "REQ-1001",
  "result": {
    "primaryCpt": {
      "code": "CPT_CODE",
      "description": "Procedure description",
      "score": 0.94
    },
    "alternatives": [],
    "evidence": {
      "registryMatch": true,
      "historicalMatch": true,
      "surgeonHistoryMatch": true
    }
  },
  "confidence": 0.94,
  "warnings": [],
  "requiresHumanReview": false,
  "nextRecommendedAgents": [
    "cost",
    "orTime",
    "staff"
  ]
}
```

The actual CPT value must come from the authorized CPT registry.

------------------------------------------------------------------------

## 10. Shared Context Update

Before:

``` json
{
  "patient": {},
  "procedure": {},
  "cpt": {}
}
```

After:

``` json
{
  "patient": {},
  "procedure": {},
  "cpt": {
    "primary": {},
    "alternatives": [],
    "confidence": 0.94,
    "warnings": []
  }
}
```

The Orchestrator then determines the next tasks.

------------------------------------------------------------------------

## 11. Agent Handoff

Typical workflow:

``` text
CPT Agent
     ↓
Validated CPT Result
     ↓
Agent Orchestrator
     |
     +------------+------------+
     |            |            |
     v            v            v
Cost Agent   OR Time Agent  Staff Agent
```

These agents can often run in parallel because they use the same
CPT/procedure context.

------------------------------------------------------------------------

## 12. What the CPT Agent Does NOT Do

The CPT Agent should not:

-   Create an OR schedule
-   Assign staff
-   Calculate final OR utilization
-   Submit claims
-   Make irreversible billing changes
-   Change important patient records without authorization
-   Invent CPT codes
-   Override coding rules

Its responsibility is:

``` text
Identify
   ↓
Validate
   ↓
Rank
   ↓
Explain
   ↓
Return
```

------------------------------------------------------------------------

## 13. CPT Agent in the Admin Panel

The CPT Agent should work primarily as a background specialized worker,
not only as a chatbot.

For example, on a surgery/case screen:

``` text
+----------------------------------------------+
| CPT ANALYSIS                                 |
+----------------------------------------------+
| Procedure: Total Knee Replacement            |
|                                              |
| Recommended CPT: XXXXX                       |
| Confidence: 94%                              |
|                                              |
| Registry Match: ✓                            |
| Historical Match: ✓                          |
| Surgeon History: ✓                           |
|                                              |
| Alternative Codes: 2                         |
|                                              |
| [View Details] [Review]                      |
+----------------------------------------------+
```

The existing chatbot can still allow users to ask questions, but the CPT
Agent itself should run automatically when the workflow requires it.

------------------------------------------------------------------------

## 14. AI Agent Activity

The AI Operations area can show:

``` text
CPT Codes Agent
● Completed

Task:
Identify CPT for Case #1024

Input:
Total Knee Replacement

Result:
1 primary candidate
2 alternatives

Confidence:
94%

Status:
Validated

Next:
Cost Agent
OR Time Agent
Staff Agent
```

------------------------------------------------------------------------

## 15. Error Handling

If the CPT registry is unavailable:

``` text
CPT Agent
    ↓
Registry Error
    ↓
Retry
    ↓
Still unavailable?
    ↓
Controlled Failure
    ↓
Human Review
```

Never silently substitute an unverified AI-generated CPT.

------------------------------------------------------------------------

## 16. Audit Trail

Record:

``` text
request_id
task_id
case/patient reference
input context
registry searches
candidate codes
scores
selected recommendation
confidence
warnings
agent version
model used
timestamp
human review
final decision
```

This supports debugging, governance and operational transparency.

------------------------------------------------------------------------

## 17. Security

The CPT Agent should access only the data required for its task.

Recommended:

``` text
CPT Agent
    ↓
CPT Tools
    ↓
Authorized Data Access
```

Do not give the AI unrestricted database access.

The Gemini API key should remain protected on the server/backend.

------------------------------------------------------------------------

## 18. Gemini Usage

Reuse the existing Gemini integration:

``` text
lib/gemini.js
      ↓
CPT Agent
```

### Gemini

Use for:

-   Procedure text interpretation
-   Ambiguity analysis
-   Explanation
-   Recommendation reasoning
-   Natural-language summaries

### Deterministic services

Use for:

-   CPT lookup
-   Registry matching
-   Active/inactive status
-   Scoring calculations
-   Validation rules
-   Database operations

------------------------------------------------------------------------

## 19. Recommended Implementation Structure

``` text
src/
├── agents/
│   └── cpt/
│       ├── CPTCodesAgent.js
│       ├── CPTPrompt.js
│       └── CPTValidator.js
│
├── agent-tools/
│   └── CPTTools.js
│
├── services/
│   ├── aiOperations/
│   │   ├── CPTIntelligence.js
│   │   ├── SurgeonIntelligence.js
│   │   └── HistoricalIntelligence.js
│   │
│   └── gemini.js
```

Documentation:

``` text
docs/
└── agents/
    └── cpt-codes-agent-workflow.md
```

------------------------------------------------------------------------

## 20. End-to-End Example

### Patient created manually

``` text
Patient Create Form
        ↓
Patient Intake Agent
        ↓
Patient Context
```

### Procedure available

``` text
Procedure:
Total Knee Replacement
```

### Orchestrator calls CPT Agent

``` text
Agent Orchestrator
        ↓
CPT Codes Agent
```

### CPT Agent executes

``` text
Read procedure
      ↓
Validate information
      ↓
Search CPT registry
      ↓
Generate candidates
      ↓
Historical intelligence
      ↓
Score candidates
      ↓
Validate candidates
      ↓
Calculate confidence
```

### Result

``` text
Primary CPT
Confidence: 94%
Alternatives: 2
Warnings: 0
Human Review: No
```

### Orchestrator continues

``` text
CPT Result
     |
     +-----------+-----------+
     |           |           |
     v           v           v
   Cost       OR Time      Staff
     |           |           |
     +-----------+-----------+
                 |
                 v
            Scheduling
                 |
                 v
           Optimization
                 |
                 v
              Billing
```

------------------------------------------------------------------------

## 21. Final CPT Agent Workflow

``` text
PATIENT / PROCEDURE CONTEXT
          ↓
     CPT REGISTRY
          ↓
     CANDIDATE CODES
          ↓
   HISTORICAL EVIDENCE
          ↓
      AI REASONING
          ↓
      VALIDATION
          ↓
      CONFIDENCE
          ↓
 HUMAN REVIEW IF NEEDED
          ↓
  STRUCTURED CPT RESULT
          ↓
     NEXT AGENTS
```

## Golden Rule

``` text
AI interprets.
Registry provides codes.
Deterministic logic validates.
Agent recommends.
Human reviews when required.
Orchestrator controls the next step.
```

The CPT Codes Agent is a specialized worker inside the New ASC
multi-agent system, not an independent chatbot.
