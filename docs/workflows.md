# Workflow Registry

## Purpose

RoleFlow Agents treats workflows as durable managed objects, not as loose chat history.

The registry gives the orchestrator a stable basis for:
- selecting `first_run` vs `daily`
- deciding whether to repair, revise, derive, create, or retire a workflow
- understanding which roles belong to the workflow
- knowing which runbook, artifacts, and analysis template are currently approved

## Minimal schema

```yaml
workflow_id: wf-0001
slug: macro-daily
name: Macro Daily Analysis
purpose: Produce a daily macro report from approved data sources
role_sequence:
  - builder
  - analyst
  - operator
workflow_state: drafting | trial | approved_daily | suspended | retired
current_mode: first_run | daily
approved_artifacts:
  data_source: artifacts/macro/latest.json
approved_analysis_template: templates/macro-report-v1.md
approved_runbook: runbooks/macro-daily-v1.md
lifecycle_intent: repair | revise | derive | create | retire
origin:
  type: created | derived
  parent_workflow_id: wf-0000
  reason: <short text>
```

## Naming convention

Recommended file name:

- `0001-macro-daily.yaml`
- `0002-market-brief.yaml`

Recommended internal identity:

- `wf-0001`
- `wf-0002`

Why both?
- file name is easy for humans to sort and scan
- internal id is stable even if the slug changes later

## Lifecycle meanings

### repair
The workflow design is still valid, but execution is broken.

### revise
The workflow remains the same workflow, but approved rules, templates, or assets must change.

### derive
Create a new workflow from an existing one when the parent is similar but no longer identical.

### create
Create a new workflow with no suitable parent.

### retire
Stop using the workflow as an active path.

## Decision guideline for orchestrator

Ask these questions in order:

1. Is the goal still the same workflow goal?
2. Is the role sequence still materially the same?
3. Is the approved daily structure still reusable?

Interpretation:
- same goal + same structure + broken execution -> `repair`
- same goal + same structure + changed approved logic -> `revise`
- similar parent but distinct cadence/structure/purpose -> `derive`
- no suitable parent -> `create`
- no longer useful or safe -> `retire`


## Mode enforcement

Mode selection should come from workflow state, not from ad-hoc prompt wording.

Recommended mapping:
- `drafting` -> `first_run`
- `trial` -> `first_run`
- `approved_daily` -> `daily`
- `suspended` -> `first_run`
- `retired` -> no active execution path

Daily mode should fall back to review-heavy mode when guards fail, for example:
- input structure changed materially
- validation is no longer reliable
- analysis logic no longer fits the approved workflow
- operator output no longer matches the approved runbook


## Control plane vs runtime plane

A workflow definition file is not the same thing as daily execution state.

### Control plane (`workflows/*.yaml`)
Use workflow files for slow-changing, approved definitions:
- workflow identity
- purpose
- role sequence
- workflow state
- approved runbooks and artifact references
- guard, retry, and escalation policy

These files should change only when the workflow itself changes.

### Runtime plane (`runtime/workflow-runs/...`)
Use runtime run records for fast-changing execution state:
- current run status
- current stage
- timestamps
- retries
- outputs
- anomalies
- escalation state

This is where the operator should write.

## Operator rule

The operator updates execution state, not workflow definition.

That means:
- operator may update run records
- operator may report outputs and anomalies
- operator should not rewrite workflow identity, approved runbooks, or lifecycle policy during routine execution

## Suggested layout

```text
workflows/
  0001-macro-daily.yaml
runtime/
  workflow-runs/
    wf-0001/
      latest.json
      history/
        2026-03-09T09-00-00.json
```

## Runtime state example fields

```yaml
run_id: run-20260309-0900
workflow_id: wf-0001
status: running | completed | failed | timed_out
current_stage: builder | analyst | operator
started_at: <timestamp>
last_progress_at: <timestamp>
retry_count: 0
outputs:
  - <artifact-or-link>
anomalies:
  - <point>
need_escalation: false
```


## Daily reliability fields

A daily workflow usually needs more than identity and lifecycle metadata. It also needs a small reliability layer.

Recommended fields:

```yaml
daily_expectations:
  deadline: '09:30'
  max_step_delay_minutes: 20
  max_retries_per_step: 2
  escalation_target: orchestrator

guards:
  input:
    - validated data artifact exists
    - required fields match approved schema
  analysis:
    - analyst output includes required decision fields
  execution:
    - operator output matches approved runbook shape

fallback_policy:
  on_builder_failure:
    action: retry_then_suspend
  on_analyst_timeout:
    action: retry_then_escalate
  on_operator_anomaly:
    action: escalate_and_hold
```

These fields do not guarantee success by themselves. They define how the orchestrator should react when a daily workflow slows down, fails validation, or drifts away from the approved path.


## Failed run example

A healthy example is not enough. A workflow design should also show what happens when a daily step fails or stalls.

Example failure case:
- Builder completed successfully
- Analyst timed out during daily execution
- Guard status changed to `failed_timeout`
- Retry policy was attempted within the daily window
- The orchestrator escalated and moved the workflow back toward review-heavy handling

Suggested example runtime file:

```text
runtime/workflow-runs/wf-0001/history/2026-03-10T09-00-00-timeout.json
```

This makes failure handling visible instead of leaving it as an implied behavior.
