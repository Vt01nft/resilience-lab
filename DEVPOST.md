# Resilience Lab

## Tagline

Replay the moment your AI agent breaks.

## One-line pitch

Resilience Lab is an agent flight recorder that captures model, MCP, retrieval, schema, and escalation failures, replays them, and proves whether the agent recovers safely before users ever see the break.

## What it does

Resilience Lab gives AI teams a chaos workbench for production agents:

- Pick a high-stakes agent scenario.
- Inject LLM brownouts, MCP server 500s, stale retrieval, malformed tool output, and escalation failures.
- Watch a timestamped recovery timeline.
- See the resilience score, unsafe-output prevention, active failure count, and estimated loss avoided.
- Run regression checks for launch readiness.
- Block or pass a CI launch gate with a generated replay command.
- Inspect a dependency health matrix.
- Compare the current replay against a hardened baseline.
- Generate an auto-remediation backlog with owners and priorities.
- Save recent replay sessions locally.
- Export a judge-ready JSON evidence report that explains what failed and how the agent protected the user.
- Use the one-click Judge demo path for a fast, repeatable walkthrough.

The current demo focuses on three serious agent categories: insurance claims, DevOps incident response, and vendor-risk review.

## Why it matters

Most AI agent demos only prove the happy path. Real deployments fail in quieter ways: a tool times out, a model returns malformed JSON, a retriever produces stale evidence, or an escalation system refuses writes. Those moments are where users lose trust.

Resilience Lab turns those failure modes into replayable tests. The product is built around a simple belief: an agent is not production-ready until its failure behavior is visible, repeatable, and safe.

## Sponsor fit

Primary target: TrueFoundry: Resilient Agents.

The challenge asks how agents behave when MCP servers error, LLM providers go down, and infrastructure chaos reaches the user experience. Resilience Lab is built directly for that question. It shows the failure, the route change, the guarded response, the handoff behavior, and the proof artifact.

## Technical direction

The prototype is a Vite, React, and TypeScript web app with a deterministic replay engine in `src/engine.ts`. It generates scenario-specific timelines, launch scores, safe responses, regression checks, dependency health, CI gate outcomes, remediation tasks, and downloadable JSON reports.

The next implementation layer would add:

- A proxy around model gateway calls.
- MCP request and response capture.
- Failure injection profiles for latency, 500s, malformed payloads, stale retrieval, and rate limits.
- Replay sessions that become regression tests.
- Exportable resilience reports for engineering, compliance, and customer-facing operations.

## Demo script

1. Open Resilience Lab.
2. Click Judge demo.
3. Show the claims scenario with LLM brownout, MCP failure, stale retrieval, and blocked handoff.
4. Point to the agent flight recorder timeline.
5. Explain that the agent did not guess coverage or hide the failed dependency.
6. Click Worst case to trigger every failure mode.
7. Show regression checks and session history.
8. Show the CI launch gate blocking release.
9. Show dependency health and the auto-remediation backlog.
10. Download the JSON report and explain how it becomes a regression test and audit artifact.
11. Switch to DevOps Incident Agent to show that this is infrastructure, not a one-off assistant.

## What makes it different

This is not another chatbot, support assistant, or dashboard skin. It is a reliability product for the agent stack itself.

The winning product version would sit between the agent and its dependencies, record real failure traces, and let teams prove recovery behavior before launch.
