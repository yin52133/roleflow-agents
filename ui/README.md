# RoleFlow UI

Local-only read-only viewer for the `roleflow-agents` repository.

## Goals
- bind to `127.0.0.1`
- default to Chinese, with English switch
- show only the four in-repo roles and local workflow/runtime examples
- avoid external agent integrations in V1

## Run

```bash
cd ui
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:3210
```

## V1 scope
- overview cards
- workflow list
- workflow detail
- runtime latest/history detail
- language switch

## V1 non-goals
- editing workflow definitions
- mutating runtime state
- external OpenClaw agent integrations
- public network exposure
