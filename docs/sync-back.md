# Syncing Changes Back from a Live Workspace

## Principle

Treat `roleflow-agents` as the framework repository and your active workspace as the live deployment environment.

- The framework repo stores reusable patterns, schemas, role rules, workflow governance, and viewer behavior.
- The live workspace stores real workflows, real runtime state, business-specific prompts, private thresholds, and environment-specific integrations.

## What should sync back

Sync changes back to `roleflow-agents` when they are framework-level improvements such as:

- new or improved workflow states
- role rule improvements that are broadly reusable
- skill improvements that are not business-specific
- workflow schema changes
- runtime schema changes
- reusable examples
- viewer improvements tied to the framework model

## What should stay in the live workspace

Do **not** sync back:

- private prompts or secrets
- business-specific workflow content
- customer-specific thresholds or templates
- local environment paths or integrations
- temporary workarounds that only make sense in one deployment
- raw runtime data from real operations

## Three-question filter

Before syncing a change back, ask:

1. Does this still make sense after removing my business context?
2. Is this a framework improvement or just an instance adaptation?
3. Would another user of `roleflow-agents` benefit from this change?

Only sync back when the answer is strongly yes.

## Suggested workflow

1. Validate the change in the live workspace first.
2. Label the change mentally or in notes as either:
   - `instance change`
   - `framework candidate`
3. Abstract the framework candidate so it no longer depends on your business-specific context.
4. Add or update examples if needed.
5. Commit the generalized result to `roleflow-agents`.

## Simple rule of thumb

- **Patterns go upstream.**
- **Instances stay local.**


## Documentation translation policy

During active development, keep only the English docs in `docs/` as the canonical source.

Release-time rule:
- English docs are the source of truth.
- Chinese docs are generated or updated as a release-synced translation set.
- `docs/zh` should always be derived from `docs/en` (or the current English canonical docs), not edited as an independent source.

Practical rule of thumb:
- **During iteration:** update English docs only.
- **Before release:** perform one concentrated English -> Chinese sync.
- **After release:** keep English as the upstream source for the next round.
