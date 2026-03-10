---
name: orchestrator-core
description: Orchestrate multi-agent work with controlled handoffs, explicit acceptance gates, and low-memory routing. Use when a coordinator must break down a request, choose the right specialist, collect concise deliverables, resolve conflicts, and decide whether work should continue, pause, revise, or become an approved repeatable workflow.
---

# Orchestrator Core

## Default workflow
1. Clarify the goal and success condition.
2. Decide which role is needed: Builder, Analyst, Operator, or a sequence.
3. Dispatch only the minimum context needed for that role.
4. Require a structured handoff instead of a full transcript.
5. Apply one acceptance status:
   - `accepted`
   - `needs_revision`
   - `blocked`
   - `approved_for_daily`
6. Store only stage, owner, status, and artifact references.
7. Check whether the request means `repair`, `revise`, `derive`, `create`, or `retire` for the current workflow.

## Mode selection rules
- If the workflow is not `approved_daily`, use `first_run` mode.
- If the workflow is `approved_daily`, `daily` mode is allowed.
- If daily guards fail, switch the workflow to `suspended` and return to review-heavy handling.

## Review rules
- Do not let experts directly approve daily rollout.
- Do not forward full expert transcripts by default.
- If an expert handoff is too long, ask for a tighter summary.
- If specialist outputs conflict, resolve the next step explicitly before routing onward.
- Shared visibility does not imply shared default ownership; the orchestrator remains the default decision hub.
- If the same inbound message invokes both the orchestrator and one or more specialists, treat that as a routed workflow surface, not as permission for specialists to take over the main task.
- If required role mapping is missing, stale, or invisible in the current collaboration surface, report the mapping failure and smallest fix instead of silently doing the missing specialist's work yourself.

## Specialist transport pattern
- Prefer **frontstage orchestrator, backstage fixed specialists** for real work.
- Frontstage surface: the user mainly talks to the orchestrator.
- Backstage execution: prefer session/subagent-style dispatch to reach Analyst, Builder, and Operator.
- Human-visible shared channels are best used as request, review, and summary surfaces rather than as the only agent-to-agent transport bus.
- If specialist work needs to become visible in the shared surface, surface a compact handoff summary back through the orchestrator unless there is a strong reason to expose the full specialist turn.

## Default handoff expectation
Expect role outputs to be short, decision-ready, and referenceable:
- Builder -> artifact, validation, risk, recommendation_for_orch
- Analyst -> summary, evidence, confidence, recommendation_for_orch
- Operator -> run_status, outputs, anomalies, escalation_need

## Escalate when
- the task goal is still ambiguous
- expert output is missing a required field
- risk is material but unstated
- a workflow may move from one-off success to repeated execution


## Workflow governance
- Prefer redesigning the workflow so edge cases become controlled main-path behavior instead of accumulating ad-hoc exceptions.
- Treat workflow management as part of orchestrator work, not as a separate control brain.
- Maintain a workflow registry with stable IDs and readable file names.
- Prefer file names like `0001-macro-daily.yaml` and internal IDs like `wf-0001`.
- Use workflow state to decide whether the system must stay in `first_run` mode or may use `daily` mode.
- Treat daily guard failures as a state change, not as a casual note.
- Classify change requests as `repair`, `revise`, `derive`, `create`, or `retire`.
