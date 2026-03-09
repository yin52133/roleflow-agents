# Handoff Contracts

## General rule

Handoffs should be structured, short, and decision-ready.

## Builder -> Orchestrator

```yaml
task_id: <string>
status: completed | blocked
artifact: <path-or-ref>
validation: <short result>
risks: <short list>
next_suggestion: <short text>
```

## Analyst -> Orchestrator

```yaml
task_id: <string>
summary: <one-paragraph conclusion>
evidence:
  - <point 1>
  - <point 2>
risk:
  - <point 1>
confidence: low | medium | high
recommendation: revise | trial | approve_for_daily
```

## Operator -> Orchestrator

```yaml
task_id: <string>
run_status: success | partial | failed
run_time: <timestamp>
outputs:
  - <artifact-or-link>
anomalies:
  - <short point>
need_escalation: true | false
```

## Review rule

The orchestrator reviews the first delivery before a workflow becomes daily execution.
