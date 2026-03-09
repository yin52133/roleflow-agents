# State Transition Matrix

## Purpose

This matrix defines which transitions belong to workflow definition state, which belong to runtime execution state, who may trigger them, and whether review is required.

## Workflow definition state transitions

| Transition | Allowed by | Auto / Manual | Review required | Plane | Notes |
|---|---|---|---|---|---|
| `drafting -> trial` | orchestrator | manual / controlled | yes | workflow | Used when a first-run chain is ready for trial execution |
| `trial -> approved_for_trial` | orchestrator | manual / controlled | yes | workflow | Marks a workflow as good enough for repeated trial use |
| `approved_for_trial -> approved_daily` | orchestrator + human | manual | yes | workflow | Stronger approval threshold; should not happen silently |
| `approved_daily -> suspended` | orchestrator | auto or manual | no / optional | workflow | Triggered by daily guard failure, repeated retries, or meaningful runtime drift |
| `suspended -> trial` | orchestrator | manual | yes | workflow | Used after investigation or repair work |
| `any active -> retired` | orchestrator + human | manual | yes | workflow | Stops a workflow from remaining an active path |
| `parent -> derived child` | orchestrator | manual | yes | workflow | Creates a new workflow with `origin.type=derived` instead of mutating the parent |

## Runtime execution state transitions

| Transition | Allowed by | Auto / Manual | Review required | Plane | Notes |
|---|---|---|---|---|---|
| `queued -> running` | operator / orchestrator | auto | no | runtime | Start of a run instance |
| `running -> completed` | operator | auto | no | runtime | Normal successful completion |
| `running -> failed` | operator | auto | no | runtime | Explicit failure during step execution |
| `running -> timed_out` | orchestrator / supervision loop | auto | no | runtime | Usually driven by step delay or deadline guard |
| `running -> retrying` | orchestrator | auto / controlled | no | runtime | Retry should follow approved retry policy |
| `retrying -> running` | orchestrator | auto | no | runtime | New attempt under the same run context or a linked run |
| `failed / timed_out -> escalated` | orchestrator | auto / controlled | no | runtime | Signals that the issue needs orchestrator attention |
| `escalated -> closed` | orchestrator | manual | optional | runtime | After reroute, suspend, repair, or human decision |

## Authority rules

- **Operator** may update runtime execution state, outputs, anomalies, and progress.
- **Operator** must not mutate workflow definition state during routine execution.
- **Analyst** and **Builder** may recommend changes, but must not move workflow definition state on their own.
- **Orchestrator** owns workflow state transitions and may trigger runtime retries, escalation, suspend, or reroute.
- **Human approval** is recommended whenever a workflow is promoted into `approved_daily` or retired permanently.

## Design rule

If a transition changes the meaning, approval level, or lifecycle of the workflow, it belongs to the **workflow plane**.

If a transition only describes the status of a specific run, it belongs to the **runtime plane**.
