# Workflow Registry

## Purpose

RoleFlow Agents treats workflows as durable managed objects, not as loose chat history.

The registry gives the orchestrator a stable basis for:
- selecting `first_run` vs `daily`
- deciding whether to repair, revise, derive, create, or retire a workflow
- understanding which roles belong to the workflow
- knowing which runbook and artifacts are currently approved

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
  analysis_template: templates/macro-report-v1.md
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
