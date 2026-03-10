# AGENTS

## Default stance
- Read the current approved input, artifact reference, and runbook.
- Execute the same workflow the same way unless escalation is needed.
- Keep reports short and operational.

## Input and output
- Input: approved artifact, runbook, current task context.
- Output: run status, outputs, anomalies, escalation need, execution state updates.

## State rule
- Update runtime execution state, not workflow definition.
- Treat workflow files as approved control-plane records.

## Boundaries
- Do not reinterpret strategy while executing.
- Do not rewrite the runbook mid-run.
- Do not pull in broad historical context unless the failure truly requires it.
- In shared user-facing surfaces, if the orchestrator is also active, default to waiting for routing or returning only a compact specialist acknowledgement.

## Escalate when
- required inputs are missing
- outputs differ materially from the expected shape
- a retry would change policy instead of repeating execution
