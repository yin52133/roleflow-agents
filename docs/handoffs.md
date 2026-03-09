# Handoff Contracts

## Why split handoffs into two modes?

A workflow that runs for the first time is solving a different problem from a workflow that runs every day.

- **First-run mode** is for establishing the workflow.
- **Daily mode** is for preserving a workflow that has already been approved.

In plain terms:

- **First-run** asks: can this chain be built, reviewed, and stabilized?
- **Daily** asks: is the approved chain still running normally today?

## Core rule: data may flow, decisions must re-center

RoleFlow Agents separates **artifact flow** from **decision flow**.

### Artifact flow may move directly
Examples:
- Builder produces a dataset for Analyst
- Analyst reads an approved artifact from Builder
- Operator consumes an approved artifact reference

This kind of handoff is about inputs and outputs.

### Decision flow must re-center
Examples:
- whether a result is good enough to continue
- whether a workflow is ready for daily use
- whether an anomaly is safe to ignore
- whether execution should stop, retry, or escalate

These decisions should flow through the orchestrator, or through rules already approved by the orchestrator.

In short:

> **Data can move directly. Control should not drift.**

## Mode 1: First-run handoffs

### Purpose
Use first-run mode when a workflow is still being established.

This mode is heavier because the system is still answering questions like:
- Is the artifact reusable?
- Is the analysis decision-ready?
- Is the runbook stable enough for repeated execution?
- Is this ready for trial or daily use?

### Typical control path

```text
Orchestrator -> Builder -> Orchestrator -> Analyst -> Orchestrator -> Operator (trial) -> Orchestrator
```

This is intentionally review-heavy.

### First-run builder handoff

```yaml
task_id: <string>
status: completed | blocked
artifact: <path-or-ref>
validation: <short result>
assumptions:
  - <point>
risks:
  - <point>
setup_notes:
  - <point>
next_suggestion: <short text>
```

### First-run analyst handoff

```yaml
task_id: <string>
summary: <one-paragraph conclusion>
evidence:
  - <point>
risk:
  - <point>
confidence: low | medium | high
limits:
  - <point>
recommendation: revise | trial | approve_for_daily
```

### First-run operator handoff (trial run)

```yaml
task_id: <string>
run_status: success | partial | failed
outputs:
  - <artifact-or-link>
anomalies:
  - <point>
mismatch_with_expected:
  - <point>
stabilization_notes:
  - <point>
need_escalation: true | false
```

### First-run review rule

The first successful chain is not automatically a daily workflow.

The orchestrator should decide one of these:
- `accepted`
- `needs_revision`
- `blocked`
- `approved_for_trial`
- `approved_for_daily`

## Mode 2: Daily handoffs

### Purpose
Use daily mode when the workflow has already been approved and the main goal is stable repetition.

This mode is lighter because the workflow has already been defined.

### Typical control path

A common daily control path is:

```text
Orchestrator -> Operator -> Orchestrator
```

A common daily data path may also include:

```text
Builder -> Analyst -> Orchestrator -> Operator
```

or, when rules are already approved:

```text
Builder -> Analyst -> Operator
```

But even in that lighter pattern, the approval logic still comes from the orchestrator's accepted rules rather than from ad-hoc lateral decisions.

### Daily builder handoff

```yaml
task_id: <string>
artifact: <path-or-ref>
validation: <short result>
anomalies:
  - <point>
```

### Daily analyst handoff

```yaml
task_id: <string>
summary: <short conclusion>
delta:
  - <what changed from normal>
risk_change:
  - <point>
confidence: low | medium | high
recommendation: continue | review | escalate
```

### Daily operator handoff

```yaml
task_id: <string>
run_status: success | partial | failed
run_time: <timestamp>
outputs:
  - <artifact-or-link>
anomalies:
  - <point>
need_escalation: true | false
```

### Daily escalation rule

Daily mode should switch back into a heavier review path when:
- input structure changes
- artifact validation becomes unreliable
- analysis logic no longer fits current data
- execution deviates materially from the approved runbook
- policy decisions would need to change

## Practical summary

### First-run mode
- establish the chain
- review more
- record assumptions and setup notes
- decide whether the workflow is ready for trial or daily use

### Daily mode
- preserve the chain
- keep handoffs shorter
- focus on deltas, anomalies, and escalation
- avoid rebuilding the workflow on every run


## Analysis format stability

The analysis format should usually be approved during first-run mode.

That means:
- first-run analysis helps define what fields and structure the workflow needs
- daily analysis should follow that approved format instead of drifting every run
- if the approved format stops fitting the real data, that should be treated as a workflow review signal

This reduces format drift and makes daily outputs easier to compare over time.
