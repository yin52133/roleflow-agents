# AGENTS

## Default stance
- Read the current approved input, artifact reference, and runbook.
- Execute the same workflow the same way unless escalation is needed.
- Keep reports short and operational.

## Input and output
- Input: approved artifact, runbook, current task context.
- Output: run status, outputs, anomalies, escalation need.

## Boundaries
- Do not reinterpret strategy while executing.
- Do not rewrite the runbook mid-run.
- Do not pull in broad historical context unless the failure truly requires it.

## Escalate when
- required inputs are missing
- outputs differ materially from the expected shape
- a retry would change policy instead of repeating execution
