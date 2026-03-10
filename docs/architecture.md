# RoleFlow Architecture

## Goal

Design a multi-agent system where the orchestrator stays thin, experts stay focused, and repeated execution does not silently inherit draft-level decisions.

This architecture is not built around “more agents.” It is built around a few deliberate constraints that reduce role drift, context pollution, and memory bloat.

RoleFlow Agents supports both repeatable operational workflows and one-off task workflows. Daily mode is only one branch of the overall model, not the whole model.

## Core trade-offs

RoleFlow Agents makes four explicit trade-offs:

1. **Single Decision Hub**  
   Experts may produce outputs, but only the orchestrator advances workflow state.

2. **Summary-First Handoff**  
   Experts return short, structured handoffs instead of long internal transcripts.

3. **Acceptance Before Repetition**  
   A one-off success must pass review before it becomes repeated execution.

4. **Thin Orchestrator Memory**  
   The orchestrator stores workflow state and references, not specialist long-form detail.

These trade-offs are what make the system stable over time.

## Topology

```text
User -> Orchestrator -> Expert
User <- Orchestrator <- Expert
                |
                -> Operator
```

This is a control topology, not just a message topology. The orchestrator is the decision hub.

## Frontstage vs backstage

A practical deployment does not require every specialist turn to appear in the same user-facing chat surface.

A stable pattern is:
- **frontstage orchestrator** for user interaction and final decisions
- **backstage specialists** for analysis, build, and execution work
- a shared user-facing surface used mainly for requests, review, and compact summaries

This preserves real multi-agent separation without forcing Discord/Slack/thread transport to become the only coordination bus.

## Why experts do not route freely by default

Lateral expert collaboration feels efficient early on, but usually causes long-term instability:

- responsibilities start to overlap
- experts accumulate each other’s context
- control decisions happen without a clear owner
- the orchestrator must absorb more history just to reconstruct what happened

So the default pattern is:

- experts report to the orchestrator
- experts may reference or pass artifacts
- experts do not become independent decision hubs

This keeps role boundaries legible and makes review possible.

## Artifact flow vs decision flow

A key distinction in RoleFlow Agents is that **artifacts and decisions are not the same thing**.

### Artifacts may flow
Examples:
- a dataset produced by Builder
- an analysis card produced by Analyst
- a run result produced by Operator

These may be referenced, attached, or passed along.

### Decisions must re-center
Examples:
- whether to continue to the next stage
- whether a risk is acceptable
- whether a workflow is approved for daily execution
- whether a failed run should be retried or blocked

These decisions flow through the orchestrator.

This separation allows information reuse without letting control drift.

## Why the orchestrator stays thin

The orchestrator is useful only if it remains an orchestrator.

If it starts to absorb:
- expert full reasoning
- implementation detail dumps
- long analytical prose
- entire expert transcripts

then it stops being a routing layer and becomes a second generalist. That increases cost, latency, and memory pollution.

### The orchestrator stores
- task id
- current stage
- active artifact reference
- acceptance status
- next owner

### The orchestrator avoids storing
- full expert reasoning
- long implementation details
- raw expert conversation history
- domain-specific deep context unless escalation requires it

This is the main mechanism behind low-memory orchestration.


## Control plane vs runtime plane

RoleFlow Agents should separate workflow definition from execution state.

### Control plane
- workflow identity
- approved runbook
- approved artifact references
- lifecycle rules
- mode selection rules

### Runtime plane
- current run status
- step progress
- retries
- outputs
- anomalies
- escalation state

This separation prevents daily execution noise from mutating approved workflow definitions.

## Workflow registry and mode selection

The orchestrator should not decide only from live conversation context. It should also maintain a workflow registry.

Each workflow should have a durable record of:

- `workflow_id`
- `slug`
- `name`
- `purpose`
- `role_sequence`
- `workflow_state`
- `current_mode`
- approved artifact references
- approved runbook reference
- lifecycle intent

Recommended file naming:

- `0001-macro-daily.yaml`
- `0002-market-brief.yaml`

Recommended internal identity:

- `wf-0001`
- `wf-0002`

This separation keeps file ordering human-readable while keeping workflow identity stable for rules and references.

## Workflow lifecycle actions

The orchestrator should classify incoming requests into one of these actions:

- `repair` — the workflow design is still correct, but execution is broken
- `revise` — the workflow remains the same workflow, but approved logic or assets must change
- `derive` — create a new workflow from an existing one when the parent is similar but no longer identical
- `create` — start a new workflow with no suitable parent
- `retire` — stop using a workflow as an active path

`derive` matters because many real requests are not cleanly “new” or “edit current”. They are best modeled as a new branch with a parent reference.

## Mode enforcement

Mode selection is not descriptive only; it is controlled by workflow state.

Recommended rule:
- if `workflow_state != approved_daily`, use `first_run` mode
- if `workflow_state == approved_daily`, use `daily` mode
- if daily guards fail, switch to `suspended` and re-enter review-heavy flow

This is what makes first-run and daily paths enforceable instead of aspirational.

## First-run review model

A workflow that worked once is not automatically safe to repeat.

RoleFlow Agents uses an acceptance gate because the question changes after a one-off success:

- not “did one expert complete one task?”
- but “is this stable enough to become repeated execution?”

That is why the first rollout is reviewed before it becomes daily execution.

## Acceptance model

Use a small status gate:

- `accepted`
- `needs_revision`
- `blocked`
- `approved_for_trial`
- `approved_for_daily`

The orchestrator applies the gate. Experts do not self-approve production rollout.

## Role contract

### Orchestrator
- Own decomposition
- Own acceptance
- Own routing
- Own final decision to enter daily execution
- Do not absorb expert implementation details into long-term memory
- Prefer specialist dispatch through independent sessions/subagents when the shared surface is noisy or unreliable

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


## Guards, retries, and escalation

Guards do not "complete the work" on behalf of the system. They decide whether a workflow may continue safely.

A reliable daily workflow usually needs three separate mechanisms:

- **guards**: determine whether the current step may continue
- **retry policy**: define how many times a step may be retried and under what timing rules
- **escalation policy**: define when the orchestrator must intervene, suspend, reroute, or notify a human

In RoleFlow Agents, the operator executes the run, while the orchestrator remains responsible for supervising stalled steps, retries, and fallback decisions.


Failure handling should be visible in runtime examples, not only described in policy text. This helps distinguish a workflow system that merely defines happy paths from one that can survive stalled steps, retries, and escalations.
