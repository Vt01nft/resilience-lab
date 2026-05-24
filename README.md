# Resilience Lab

Replay the moment your AI agent breaks.

Resilience Lab is an agent flight recorder and chaos replay console for teams shipping AI agents into production. It captures model, MCP, retrieval, schema, and handoff failures, then turns the recovery trail into a launch score, evidence report, and replayable regression artifact.

## Why This Exists

Most agent demos prove the happy path. Production agents fail through partial outages: an MCP server returns 500s, a model gateway browns out, retrieval returns stale evidence, or escalation writes are blocked.

Resilience Lab makes those failures visible and testable before users see them.

## Current Prototype

- Three high-stakes demo scenarios: insurance claims, DevOps incident response, and vendor risk.
- Failure injection for LLM brownouts, MCP failures, stale retrieval, malformed tool output, and blocked handoffs.
- Deterministic replay engine in `src/engine.ts`.
- Agent flight recorder timeline.
- Resilience score and unsafe-path blocking count.
- Regression checks for safe launch behavior.
- CI launch gate with a generated replay command.
- Dependency health matrix for model, MCP, retrieval, schema, and handoff layers.
- Before/after hardening comparison.
- Auto-remediation backlog with owners and priorities.
- Local session history using `localStorage`.
- Copyable report and downloadable JSON evidence artifact.
- One-click `Judge demo` path for fast evaluation.
- Submission readiness section for the two-minute product walkthrough.

## Hackathon Positioning

Primary sponsor target: TrueFoundry: Resilient Agents.

The sponsor prompt asks what happens when MCP servers fail, LLM providers go down, or infrastructure chaos reaches the user. Resilience Lab answers that directly by showing the failure, the recovery path, and the proof artifact.

## Run Locally

```powershell
npm install
npm run dev
```

## Verify

```powershell
npm run lint
npm run build
```

## Demo Flow

1. Open the app.
2. Click `Judge demo`.
3. Keep the Insurance Claim Agent visible.
4. Show the generated session in the live replay panel.
5. Show the score, failed dependencies, blocked unsafe answer, safe recovery response, and regression checks.
6. Click `Worst case`.
7. Show the CI launch gate blocking release.
8. Show the dependency health matrix and auto-remediation backlog.
9. Download the JSON report.
10. Switch to DevOps Incident Agent to show this is reusable infrastructure, not a one-off assistant.

Direct judge-mode URL:

```text
https://resilience-lab-nine.vercel.app?demo=judge
```

## Product Roadmap

- Add a gateway proxy for OpenAI, Claude, Gemini, and self-hosted models.
- Capture real MCP request and response traces.
- Convert replay sessions into CI regression tests.
- Add team workspaces and incident history.
- Add hosted reports for launch reviews and compliance evidence.
