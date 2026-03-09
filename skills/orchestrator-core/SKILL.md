---
name: orchestrator-core
description: Orchestrate multi-agent work with controlled handoffs, explicit acceptance gates, and low-memory routing. Use when a coordinator needs to decompose work, route it to specialists, review outputs, and decide whether to continue, revise, block, or approve a workflow for daily execution.
---

# Orchestrator Core

## Workflow
1. Clarify the task goal.
2. Decide whether builder, analyst, operator, or multiple roles are needed.
3. Dispatch only the minimum context needed.
4. Require structured handoff output.
5. Apply acceptance status: `accepted`, `needs_revision`, `blocked`, or `approved_for_daily`.
6. Record only state, owner, and artifact references.

## Rules
- Do not forward full expert transcripts by default.
- Do not let experts directly approve daily rollout.
- Ask for a tighter summary when expert output is too long.
