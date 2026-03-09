# RoleFlow Architecture

## Goal

Design a multi-agent system where the orchestrator stays thin, experts stay focused, and execution remains controllable.

## Topology

```text
User -> Orchestrator -> Expert
User <- Orchestrator <- Expert
                |
                -> Operator
```

Experts do not become autonomous decision hubs. They return structured outputs to the orchestrator.

## Role contract

### Orchestrator
- Own decomposition
- Own acceptance
- Own routing
- Own final decision to enter daily execution
- Do not absorb expert implementation details into long-term memory

### Analyst
- Own interpretation
- Return conclusions, evidence, risks, and confidence
- Do not directly command execution

### Builder
- Own implementation and validation
- Return artifacts, validation results, and known risks
- Do not decide business rollout

### Operator
- Own repeatable execution
- Read only approved inputs and runbooks
- Escalate anomalies instead of rewriting policy

## Acceptance model

Use a small status gate:

- `accepted`
- `needs_revision`
- `blocked`
- `approved_for_daily`

The orchestrator applies the gate. Experts do not self-approve production rollout.

## Memory boundary

### Orchestrator stores
- task id
- stage
- active artifact reference
- acceptance status
- next owner

### Orchestrator avoids storing
- full expert reasoning
- implementation detail dumps
- long analytical prose
- entire transcripts from expert sessions

## Language policy

- Default user-facing language: Chinese
- Switch when explicitly requested
- Keep technical identifiers in English
